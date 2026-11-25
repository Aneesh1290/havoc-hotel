import db from './db.js';
import { checkTransactionStatus } from './iciciPgService.js';
import { sendBookingConfirmationEmail } from './emailService.js';

/**
 * Log Gateway callbacks and S2S Advice into audit table (Zero-Drop)
 */
export function logGatewayAdvice({
  merchantTxnNo,
  gatewayTxnId,
  amount,
  status,
  responseCode,
  signatureValid,
  callbackType = 'POST_CALLBACK',
  rawPayload
}) {
  try {
    const rawStr = typeof rawPayload === 'object' ? JSON.stringify(rawPayload) : String(rawPayload || '');
    const stmt = db.prepare(`
      INSERT INTO payment_gateway_logs 
      (merchant_txn_no, gateway_txn_id, amount, status, response_code, signature_valid, callback_type, raw_payload)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      merchantTxnNo || null,
      gatewayTxnId || null,
      amount ? Number(amount) : null,
      status || 'RECEIVED',
      responseCode || null,
      signatureValid ? 1 : 0,
      callbackType,
      rawStr
    );
  } catch (err) {
    console.error('[OrderReconciliation] Failed to log gateway advice:', err);
  }
}

/**
 * Create or update a temporary room checkout hold
 * Stores full cart details, items, contact info, and initial hold window
 */
export function createPendingHold(holdData) {
  try {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15-minute active hold window
    const itemsJson = holdData.items_json || (holdData.items ? JSON.stringify(holdData.items) : null);

    const stmt = db.prepare(`
      INSERT INTO pending_payment_holds
      (merchant_txn_no, booking_id, link_id, is_payment_link, hotel_id, hotel_name, room_id, room_name,
       rooms_count, check_in, check_out, guest_name, guest_email, guest_phone, adults, children, notes, items_json, amount,
       status, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
      ON CONFLICT(merchant_txn_no) DO UPDATE SET
        amount = excluded.amount,
        items_json = excluded.items_json,
        status = 'PENDING',
        expires_at = excluded.expires_at,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      holdData.merchantTxnNo,
      holdData.bookingId || null,
      holdData.linkId || null,
      holdData.isPaymentLink ? 1 : 0,
      holdData.hotelId || null,
      holdData.hotelName || null,
      holdData.roomId || null,
      holdData.roomName || null,
      holdData.roomsCount || holdData.rooms || 1,
      holdData.checkIn || null,
      holdData.checkOut || null,
      holdData.name || holdData.guestName || 'Guest',
      holdData.email || holdData.guestEmail || '',
      holdData.phone || holdData.guestPhone || '',
      holdData.adults || 1,
      holdData.children || 0,
      holdData.notes || '',
      itemsJson,
      Number(holdData.amount || 0),
      expiresAt
    );

    // Also mirror to permanent archive immediately for 100% retention
    archiveCheckoutHold(holdData.merchantTxnNo, 'INITIAL_INITIATION');
  } catch (err) {
    console.error('[OrderReconciliation] Error creating pending hold:', err);
  }
}

/**
 * Permanently archive a checkout hold so customer and order data are never lost
 */
export function archiveCheckoutHold(merchantTxnNo, reason = 'EXPIRED') {
  try {
    const cleanTxn = String(merchantTxnNo || '').trim();
    const hold = db.prepare('SELECT * FROM pending_payment_holds WHERE merchant_txn_no = ?').get(cleanTxn);
    if (!hold) return;

    db.prepare(`
      INSERT INTO online_checkout_holds_archive
      (merchant_txn_no, booking_id, link_id, is_payment_link, hotel_id, hotel_name, room_id, room_name,
       rooms_count, check_in, check_out, guest_name, guest_email, guest_phone, adults, children, notes, items_json,
       amount, status, gateway_txn_id, payment_mode, archived_reason, original_created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      hold.merchant_txn_no,
      hold.booking_id,
      hold.link_id,
      hold.is_payment_link,
      hold.hotel_id,
      hold.hotel_name,
      hold.room_id,
      hold.room_name,
      hold.rooms_count,
      hold.check_in,
      hold.check_out,
      hold.guest_name,
      hold.guest_email,
      hold.guest_phone,
      hold.adults,
      hold.children,
      hold.notes,
      hold.items_json,
      hold.amount,
      hold.status,
      hold.gateway_txn_id,
      hold.payment_mode,
      reason,
      hold.created_at
    );
  } catch (err) {
    console.error(`[OrderReconciliation] Error archiving hold ${merchantTxnNo}:`, err);
  }
}

/**
 * getOnlineCheckoutHold(merchantTxnNo)
 * Checks active pending_payment_holds first.
 * If not found, checks online_checkout_holds_archive.
 * Guarantees that whether ICICI responds in 5 seconds or 2 hours, full customer details are recovered.
 */
export function getOnlineCheckoutHold(merchantTxnNo) {
  try {
    const cleanTxn = String(merchantTxnNo || '').trim();
    if (!cleanTxn) return null;

    // 1. Check active holds
    const activeHold = db.prepare('SELECT * FROM pending_payment_holds WHERE merchant_txn_no = ?').get(cleanTxn);
    if (activeHold) {
      return {
        ...activeHold,
        source: 'active_holds'
      };
    }

    // 2. Check archive table
    const archivedHold = db.prepare(`
      SELECT * FROM online_checkout_holds_archive 
      WHERE merchant_txn_no = ? 
      ORDER BY id DESC LIMIT 1
    `).get(cleanTxn);

    if (archivedHold) {
      console.log(`[OrderReconciliation] Retrieved hold from archive for merchantTxnNo: ${cleanTxn}`);
      return {
        ...archivedHold,
        source: 'archive'
      };
    }

    return null;
  } catch (err) {
    console.error(`[OrderReconciliation] Error getting online checkout hold for ${merchantTxnNo}:`, err);
    return null;
  }
}

/**
 * Release a temporary room hold upon failure or cancellation
 * Releases inventory lock but retains full record in archive table
 */
export function releasePendingHold(merchantTxnNo, reason = 'CANCELLED') {
  try {
    const cleanTxn = String(merchantTxnNo || '').trim();
    archiveCheckoutHold(cleanTxn, reason);

    db.prepare(`
      UPDATE pending_payment_holds 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE merchant_txn_no = ? AND status = 'PENDING'
    `).run(reason, cleanTxn);
  } catch (err) {
    console.error('[OrderReconciliation] Error releasing pending hold:', err);
  }
}

/**
 * Unified Room Reservation Confirmation Engine (Idempotent & Transaction-Safe)
 *
 * Idempotency check:
 * 1. Checks if payment_ref (merchantTxnNo) or icici_txn_id (gatewayTxnId) already exists in bookings or payment_links.
 * 2. If already confirmed, returns the existing reservation ID without duplicate charges or duplicate room assignments.
 * 3. Locks inventory for dates, updates status to 'Confirmed (Paid Online)', clears holds, and triggers notification.
 */
export function confirmOrderUnified({
  merchantTxnNo,
  gatewayTxnId,
  amount,
  paymentMode = 'Online',
  holdDetails = null,
  rawParams = {}
}) {
  return db.transaction(() => {
    const cleanMerchantTxn = String(merchantTxnNo || '').trim();
    const cleanGatewayTxn = gatewayTxnId ? String(gatewayTxnId).trim() : null;

    // 1. Idempotency Check in Bookings
    const existingBooking = db.prepare(`
      SELECT * FROM bookings 
      WHERE iciciOrderId = ? OR (txnId IS NOT NULL AND txnId != '' AND txnId = ?)
    `).get(cleanMerchantTxn, cleanGatewayTxn || cleanMerchantTxn);

    if (existingBooking) {
      console.log(`[OrderReconciliation] Idempotency hit: Booking #${existingBooking.id} is already confirmed for txn ${cleanMerchantTxn}`);
      // Ensure pending hold is marked confirmed
      db.prepare(`UPDATE pending_payment_holds SET status = 'CONFIRMED', gateway_txn_id = ?, updated_at = CURRENT_TIMESTAMP WHERE merchant_txn_no = ?`)
        .run(cleanGatewayTxn || cleanMerchantTxn, cleanMerchantTxn);
      return {
        alreadyConfirmed: true,
        type: 'booking',
        bookingId: existingBooking.id,
        booking: existingBooking
      };
    }

    // 2. Load hold data if available from database (checks active holds first, then archive)
    const hold = holdDetails || getOnlineCheckoutHold(cleanMerchantTxn);

    // 3. Check if this is a Payment Link
    if (hold?.is_payment_link || hold?.isPaymentLink || hold?.link_id || hold?.linkId) {
      const linkId = hold.link_id || hold.linkId;
      const link = db.prepare('SELECT * FROM payment_links WHERE id = ?').get(linkId);

      if (link) {
        if (link.status === 'Paid') {
          console.log(`[OrderReconciliation] Idempotency hit: Payment link ${linkId} is already paid.`);
          return {
            alreadyConfirmed: true,
            type: 'payment_link',
            linkId,
            link
          };
        }

        const paidAt = new Date().toISOString();
        const finalAmount = Math.round(Number(amount || hold.amount || link.amount || 0));

        db.prepare(`
          UPDATE payment_links 
          SET status = 'Paid', txnId = ?, paymentMode = ?, paidAt = ?
          WHERE id = ?
        `).run(cleanGatewayTxn || cleanMerchantTxn, paymentMode || 'Online', paidAt, linkId);

        // If link was tied to an existing booking, update it as well
        if (link.bookingId || hold.booking_id || hold.bookingId) {
          const bId = link.bookingId || hold.booking_id || hold.bookingId;
          db.prepare(`
            UPDATE bookings 
            SET status = 'Confirmed (Paid Online)', paymentMethod = ?, txnId = ?, iciciOrderId = ?
            WHERE id = ?
          `).run(`ICICI PG (${paymentMode || 'Online'})`, cleanGatewayTxn || cleanMerchantTxn, cleanMerchantTxn, bId);
        }

        db.prepare(`UPDATE pending_payment_holds SET status = 'CONFIRMED', gateway_txn_id = ?, payment_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE merchant_txn_no = ?`)
          .run(cleanGatewayTxn || cleanMerchantTxn, paymentMode, cleanMerchantTxn);
        archiveCheckoutHold(cleanMerchantTxn, 'PAYMENT_CONFIRMED');

        return {
          alreadyConfirmed: false,
          type: 'payment_link',
          linkId,
          amount: finalAmount
        };
      }
    }

    // 4. Standard Room Reservation Confirmation & Safety Recovery
    // Extract available customer information from hold, archive, or fallback to ICICI response payload
    const rawCustomerName = rawParams.customerName || rawParams.responseParams?.customerName || rawParams.addlParam1 || null;
    const rawCustomerEmail = rawParams.customerEmailID || rawParams.customerEmail || rawParams.responseParams?.customerEmailID || null;
    const rawCustomerMobile = rawParams.customerMobileNo || rawParams.customerPhone || rawParams.responseParams?.customerMobileNo || null;

    const guestName = hold?.guest_name || hold?.name || rawCustomerName || 'Online Guest';
    const guestEmail = hold?.guest_email || hold?.email || rawCustomerEmail || '';
    const guestPhone = hold?.guest_phone || hold?.phone || rawCustomerMobile || '';
    const hotelId = hold?.hotel_id || hold?.hotelId || rawParams.addlParam2 || '1';
    const hotelName = hold?.hotel_name || hold?.hotelName || rawParams.addlParam1 || 'Hotel Sabharwal';
    const checkIn = hold?.check_in || hold?.checkIn || new Date().toISOString();
    const checkOut = hold?.check_out || hold?.checkOut || new Date(Date.now() + 86400000).toISOString();
    const finalAmount = Math.round(Number(amount || hold?.amount || 0));
    const roomsCount = Number(hold?.rooms_count || hold?.roomsCount || hold?.rooms || 1);
    const roomId = hold?.room_id || hold?.roomId || null;
    const adults = Number(hold?.adults || 1);
    const children = Number(hold?.children || 0);
    const notes = hold?.notes || (hold ? '' : '[Safety Recovery] Order recovered from ICICI gateway advice without active hold');

    // If hold was completely missing, log safety alert in payment_gateway_logs
    if (!hold) {
      console.warn(`[OrderReconciliation] ALERT: Hold record missing for paid txn ${cleanMerchantTxn}. Executing safety recovery booking for ₹${finalAmount}.`);
      logGatewayAdvice({
        merchantTxnNo: cleanMerchantTxn,
        gatewayTxnId: cleanGatewayTxn,
        amount: finalAmount,
        status: 'SAFETY_RECOVERY_CREATED',
        responseCode: rawParams.responseCode || '000',
        signatureValid: true,
        callbackType: 'SAFETY_RECOVERY',
        rawPayload: { alert: 'Hold was missing from DB and archive. Safety booking created.', rawParams }
      });
    }

    // Insert confirmed reservation
    const stmt = db.prepare(`
      INSERT INTO bookings 
      (name, email, phone, hotelId, hotelName, checkIn, checkOut, amount, status, rooms, roomId, adults, children, notes, paymentMethod, txnId, iciciOrderId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      guestName,
      guestEmail,
      guestPhone,
      hotelId,
      hotelName,
      checkIn,
      checkOut,
      finalAmount,
      'Confirmed (Paid Online)',
      roomsCount,
      roomId,
      adults,
      children,
      notes,
      `ICICI PG (${paymentMode || 'Card/UPI'})`,
      cleanGatewayTxn || null,
      cleanMerchantTxn
    );

    const bookingId = info.lastInsertRowid;

    // Mark pending hold as CONFIRMED & archive
    db.prepare(`
      UPDATE pending_payment_holds 
      SET status = 'CONFIRMED', gateway_txn_id = ?, payment_mode = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE merchant_txn_no = ?
    `).run(cleanGatewayTxn || cleanMerchantTxn, paymentMode, cleanMerchantTxn);
    archiveCheckoutHold(cleanMerchantTxn, 'PAYMENT_CONFIRMED');

    // Send asynchronous confirmation email/voucher if email provided
    if (guestEmail) {
      sendBookingConfirmationEmail({
        id: bookingId,
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
        hotelId,
        hotelName,
        checkIn,
        checkOut,
        amount: finalAmount,
        status: 'Confirmed (Paid Online)',
        rooms: roomsCount,
        adults,
        children,
        notes,
        paymentMethod: `ICICI PG (${paymentMode || 'Online'})`
      }).catch(e => console.error('[OrderReconciliation] Email dispatch error:', e));
    }

    console.log(`[OrderReconciliation] Successfully confirmed reservation #${bookingId} for merchantTxnNo: ${cleanMerchantTxn}`);

    return {
      alreadyConfirmed: false,
      type: 'booking',
      bookingId,
      guestName,
      hotelName,
      finalAmount
    };
  })();
}

/**
 * Reconcile a single pending hold against ICICI Command API (Pull)
 * Returns { success, isPaid, merchantTxnNo, status, bookingId }
 */
export async function reconcilePendingHold(merchantTxnNo) {
  try {
    const cleanTxn = String(merchantTxnNo || '').trim();
    const hold = db.prepare('SELECT * FROM pending_payment_holds WHERE merchant_txn_no = ?').get(cleanTxn);

    const statusCheck = await checkTransactionStatus({
      merchantTxnNo: cleanTxn,
      originalTxnNo: hold?.gateway_txn_id || cleanTxn
    });

    logGatewayAdvice({
      merchantTxnNo: cleanTxn,
      gatewayTxnId: statusCheck.txnID,
      amount: statusCheck.amount || hold?.amount,
      status: statusCheck.isPaid ? 'PAID' : (statusCheck.description || 'NOT_PAID'),
      responseCode: statusCheck.responseCode,
      signatureValid: true,
      callbackType: 'S2S_RECONCILE',
      rawPayload: statusCheck.raw
    });

    if (statusCheck.isPaid) {
      const confirmResult = confirmOrderUnified({
        merchantTxnNo: cleanTxn,
        gatewayTxnId: statusCheck.txnID,
        amount: statusCheck.amount || hold?.amount,
        paymentMode: statusCheck.paymentMode || 'Online',
        holdDetails: hold,
        rawParams: statusCheck.raw || {}
      });

      return {
        merchantTxnNo: cleanTxn,
        reconciled: true,
        isPaid: true,
        status: 'CONFIRMED',
        reservationId: confirmResult.bookingId,
        paymentLinkId: confirmResult.linkId,
        amount: statusCheck.amount || hold?.amount,
        message: confirmResult.alreadyConfirmed ? 'Already confirmed previously.' : 'Successfully reconciled and confirmed.'
      };
    } else {
      // Check if hold has expired
      const isExpired = hold?.expires_at && new Date(hold.expires_at).getTime() < Date.now();
      if (isExpired && hold?.status === 'PENDING') {
        releasePendingHold(cleanTxn, 'EXPIRED');
      }

      return {
        merchantTxnNo: cleanTxn,
        reconciled: true,
        isPaid: false,
        status: isExpired ? 'EXPIRED' : (hold?.status || 'PENDING'),
        description: statusCheck.description
      };
    }
  } catch (err) {
    console.error(`[OrderReconciliation] Error reconciling pending hold ${merchantTxnNo}:`, err);
    return {
      merchantTxnNo,
      reconciled: false,
      isPaid: false,
      status: 'ERROR',
      message: err.message
    };
  }
}

/**
 * Capacity & Concurrency Hold Query Window:
 * Returns the number of currently active held units for a specific property/room across a date window.
 * ONLY treats holds younger than 15 minutes as active blocks so abandoned checkouts don't indefinitely block slots.
 */
export function getActiveHeldRoomCount({ hotelId, roomId, checkIn, checkOut }) {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    let query = `
      SELECT SUM(rooms_count) as total_held
      FROM pending_payment_holds
      WHERE status = 'PENDING'
        AND created_at >= ?
    `;
    const params = [fifteenMinutesAgo];

    if (hotelId) {
      query += ' AND hotel_id = ?';
      params.push(String(hotelId));
    }
    if (roomId) {
      query += ' AND room_id = ?';
      params.push(String(roomId));
    }
    if (checkIn && checkOut) {
      query += ' AND check_in < ? AND check_out > ?';
      params.push(checkOut, checkIn);
    }

    const row = db.prepare(query).get(...params);
    return row?.total_held ? Number(row.total_held) : 0;
  } catch (err) {
    console.error('[OrderReconciliation] Error querying active held room count:', err);
    return 0;
  }
}

/**
 * Scan all pending holds older than 2 minutes and reconcile against ICICI Gateway
 */
export async function scanAndReconcileUnconfirmedHolds() {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const pendingList = db.prepare(`
      SELECT merchant_txn_no FROM pending_payment_holds 
      WHERE status = 'PENDING' AND created_at <= ?
      ORDER BY created_at ASC LIMIT 25
    `).all(twoMinutesAgo);

    if (!pendingList || pendingList.length === 0) {
      return [];
    }

    console.log(`[OrderReconciliation] Scanning ${pendingList.length} unconfirmed pending holds...`);
    const results = [];
    for (const item of pendingList) {
      const res = await reconcilePendingHold(item.merchant_txn_no);
      results.push(res);
    }
    return results;
  } catch (err) {
    console.error('[OrderReconciliation] Error in scanAndReconcileUnconfirmedHolds:', err);
    return [];
  }
}

/**
 * getBookedQuantities helper
 * Returns total confirmed booked units plus active temporary holds younger than 15 minutes.
 */
export function getBookedQuantities({ hotelId, roomId, checkIn, checkOut }) {
  try {
    // 1. Confirmed bookings in date range
    let bookingQuery = `
      SELECT SUM(rooms) as total_booked
      FROM bookings
      WHERE status NOT LIKE '%Cancelled%'
    `;
    const bookingParams = [];
    if (hotelId) {
      bookingQuery += ' AND hotelId = ?';
      bookingParams.push(String(hotelId));
    }
    if (roomId) {
      bookingQuery += ' AND roomId = ?';
      bookingParams.push(String(roomId));
    }
    if (checkIn && checkOut) {
      bookingQuery += ' AND checkIn < ? AND checkOut > ?';
      bookingParams.push(checkOut, checkIn);
    }
    const bookingRow = db.prepare(bookingQuery).get(...bookingParams);
    const confirmedCount = bookingRow?.total_booked ? Number(bookingRow.total_booked) : 0;

    // 2. Active holds younger than 15 minutes
    const heldCount = getActiveHeldRoomCount({ hotelId, roomId, checkIn, checkOut });

    return {
      confirmed: confirmedCount,
      activeHolds: heldCount,
      totalBlocked: confirmedCount + heldCount
    };
  } catch (err) {
    console.error('[OrderReconciliation] Error in getBookedQuantities:', err);
    return { confirmed: 0, activeHolds: 0, totalBlocked: 0 };
  }
}

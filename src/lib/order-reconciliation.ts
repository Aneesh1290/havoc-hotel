/**
 * Shared / Frontend Order Reconciliation Types & Helper
 */

export interface OrderReconciliationItem {
  merchantTxnNo: string;
  reconciled: boolean;
  isPaid: boolean;
  status: string;
  reservationId?: number | string;
  paymentLinkId?: string;
  amount?: number;
  message?: string;
}

export interface AvailabilityResult {
  success: boolean;
  hotelId: string | null;
  roomId: string | null;
  confirmed: number;
  activeHolds: number;
  totalBlocked: number;
}

export async function checkRoomAvailability(params: {
  hotelId?: string;
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
}): Promise<AvailabilityResult | null> {
  try {
    const query = new URLSearchParams();
    if (params.hotelId) query.set('hotelId', params.hotelId);
    if (params.roomId) query.set('roomId', params.roomId);
    if (params.checkIn) query.set('checkIn', params.checkIn);
    if (params.checkOut) query.set('checkOut', params.checkOut);

    const res = await fetch(`/api/availability?${query.toString()}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to check room availability:', err);
    return null;
  }
}

export async function reconcilePendingHoldClient(
  merchantTxnNo?: string
): Promise<{ success: boolean; results?: OrderReconciliationItem[]; error?: string }> {
  try {
    const res = await fetch('/api/payment/icici/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txn_id: merchantTxnNo })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'Reconciliation request failed' };
  }
}

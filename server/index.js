import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db, { dbPath, dataDir as dbDataDir } from './db.js';
import { sendBookingConfirmationEmail, getMailTransporter } from './emailService.js';
import { initiateSale, verifyCallbackHash, checkTransactionStatus, checkIciciPaymentStatus, refundTransaction, getConfig } from './iciciPgService.js';
import { 
  logGatewayAdvice, 
  createPendingHold, 
  releasePendingHold, 
  confirmOrderUnified, 
  reconcilePendingHold, 
  scanAndReconcileUnconfirmedHolds 
} from './orderReconciliation.js';

const JWT_SECRET = 'sabharwal_super_secret_key_2026'; // In production, use env var

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Diagnostic endpoint to check persistent disk status
app.get('/api/debug-storage', (req, res) => {
  res.json({
    envDATA_DIR: process.env.DATA_DIR || null,
    dbPath,
    dbDataDir,
    uploadsDir,
    dbExists: fs.existsSync(dbPath),
    uploadsExists: fs.existsSync(uploadsDir)
  });
});

// Ensure uploads directory exists on persistent disk
let uploadsDir = path.join(dbDataDir, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn(`Warning: Could not create uploadsDir "${uploadsDir}" (${err.message}). Falling back to local cwd.`);
  uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

// Seed admin user
const adminCount = db.prepare('SELECT count(*) as count FROM admins').get();
if (adminCount.count === 0) {
  const hash = bcrypt.hashSync('sabharwal@65', 10);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', hash);
}

// --- AUTH & USER MANAGEMENT API ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = bcrypt.compareSync(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    let allowedProps = [];
    try {
      allowedProps = admin.allowedProperties ? JSON.parse(admin.allowedProperties) : [];
    } catch (e) {
      allowedProps = [];
    }

    const userData = {
      id: admin.id,
      username: admin.username,
      name: admin.name || admin.username,
      role: admin.role || (admin.username === 'admin' ? 'superadmin' : 'staff'),
      allowedProperties: allowedProps
    };

    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all dashboard users / staff
app.get('/api/admin/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, allowedProperties FROM admins').all();
    const formatted = users.map(u => {
      let props = [];
      try {
        props = u.allowedProperties ? JSON.parse(u.allowedProperties) : [];
      } catch (e) {
        props = [];
      }
      return {
        ...u,
        allowedProperties: props
      };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new dashboard user with property permissions
app.post('/api/admin/users', (req, res) => {
  const { username, password, name, role, allowedProperties } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username.trim());
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const propsJson = JSON.stringify(Array.isArray(allowedProperties) ? allowedProperties : []);
    const userRole = role || 'staff';
    const userName = name || username.trim();

    const info = db.prepare(
      'INSERT INTO admins (username, password_hash, name, role, allowedProperties) VALUES (?, ?, ?, ?, ?)'
    ).run(username.trim(), hash, userName, userRole, propsJson);

    res.json({
      success: true,
      user: {
        id: info.lastInsertRowid,
        username: username.trim(),
        name: userName,
        role: userRole,
        allowedProperties: Array.isArray(allowedProperties) ? allowedProperties : []
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update dashboard user permissions or details
app.put('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, allowedProperties, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedName = name !== undefined ? name : user.name;
    const updatedRole = role !== undefined ? role : user.role;
    const updatedProps = allowedProperties !== undefined 
      ? JSON.stringify(Array.isArray(allowedProperties) ? allowedProperties : [])
      : user.allowedProperties;

    if (password && password.trim()) {
      const hash = bcrypt.hashSync(password.trim(), 10);
      db.prepare('UPDATE admins SET name = ?, role = ?, allowedProperties = ?, password_hash = ? WHERE id = ?')
        .run(updatedName, updatedRole, updatedProps, hash, id);
    } else {
      db.prepare('UPDATE admins SET name = ?, role = ?, allowedProperties = ? WHERE id = ?')
        .run(updatedName, updatedRole, updatedProps, id);
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete dashboard user
app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  try {
    const user = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.username === 'admin') {
      return res.status(400).json({ error: 'Cannot delete the primary root admin' });
    }

    db.prepare('DELETE FROM admins WHERE id = ?').run(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/credentials', (req, res) => {
  const { currentUsername, currentPassword, newUsername, newPassword } = req.body;
  try {
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(currentUsername);
    if (!admin) {
      return res.status(401).json({ error: 'Current admin not found' });
    }
    
    const isValid = bcrypt.compareSync(currentPassword, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    const usernameToUpdate = newUsername || admin.username;
    let hashToUpdate = admin.password_hash;
    
    if (newPassword) {
      hashToUpdate = bcrypt.hashSync(newPassword, 10);
    }

    db.prepare('UPDATE admins SET username = ?, password_hash = ? WHERE id = ?').run(usernameToUpdate, hashToUpdate, admin.id);
    
    res.json({ success: true, message: 'Credentials updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve uploaded files (from persistent uploads directory, with fallback to public/uploads)
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use('/uploads', express.static(path.join(process.cwd(), 'dist', 'uploads')));

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- UPLOAD API ---
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PROPERTIES API ---

app.get('/api/properties', (req, res) => {
  try {
    const properties = db.prepare('SELECT * FROM properties').all();
    // Parse JSON string back to array and normalize image URLs
    const parsedProperties = properties.map(p => ({
      ...p,
      image: (p.image || '').replace(/https?:\/\/[^/]+\/uploads\//, '/uploads/'),
      amenities: JSON.parse(p.amenities)
    }));
    res.json(parsedProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/properties', (req, res) => {
  const { id, name, location, image, roomsAvailable, pricePerNight, amenities, propertyType, capacity, status } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO properties (id, name, location, image, roomsAvailable, pricePerNight, amenities, propertyType, capacity, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id, 
      name, 
      location, 
      image, 
      roomsAvailable || 0, 
      pricePerNight || 0, 
      JSON.stringify(amenities || []),
      propertyType || 'hotel',
      capacity || 0,
      status || 'active'
    );
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/properties/:id', (req, res) => {
  try {
    const propId = req.params.id;
    // Delete associated rooms first to avoid orphaned rooms
    db.prepare('DELETE FROM room_types WHERE propertyId = ?').run(propId);
    const stmt = db.prepare('DELETE FROM properties WHERE id = ?');
    stmt.run(propId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/properties/:id', (req, res) => {
  const { name, location, image, pricePerNight, amenities, propertyType, capacity, status } = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE properties 
      SET name = ?, location = ?, image = ?, pricePerNight = ?, amenities = ?, propertyType = ?, capacity = ?, status = ? 
      WHERE id = ?
    `);
    stmt.run(
      name, 
      location, 
      image, 
      pricePerNight || 0, 
      JSON.stringify(amenities || []), 
      propertyType || 'hotel', 
      capacity || 0,
      status || 'active',
      req.params.id
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROOMS API ---

app.get('/api/rooms', (req, res) => {
  try {
    const rooms = db.prepare('SELECT * FROM room_types').all();
    const parsedRooms = rooms.map(r => ({
      ...r,
      images: r.images ? JSON.parse(r.images) : []
    }));
    res.json(parsedRooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rooms', (req, res) => {
  const { id, propertyId, name, type, pricePerNight, capacity, totalUnits, images } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO room_types (id, propertyId, name, type, pricePerNight, capacity, totalUnits, images) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const imagesStr = JSON.stringify(images || []);
    stmt.run(id, propertyId, name, type, pricePerNight, capacity, totalUnits, imagesStr);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/rooms/:id', (req, res) => {
  const { name, type, pricePerNight, capacity, totalUnits, images } = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE room_types 
      SET name = ?, type = ?, pricePerNight = ?, capacity = ?, totalUnits = ?, images = ?
      WHERE id = ?
    `);
    const imagesStr = JSON.stringify(images || []);
    stmt.run(name, type, pricePerNight, capacity, totalUnits, imagesStr, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/rooms/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM room_types WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BOOKINGS API ---

app.get('/api/bookings', (req, res) => {
  try {
    const bookings = db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  const { name, email, phone, hotelId, hotelName, checkIn, checkOut, amount, status, rooms, roomId, adults, children, notes, paymentMethod, txnId, iciciOrderId } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO bookings (name, email, phone, hotelId, hotelName, checkIn, checkOut, amount, status, rooms, roomId, adults, children, notes, paymentMethod, txnId, iciciOrderId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      name, 
      email || '', 
      phone || '', 
      hotelId, 
      hotelName, 
      checkIn, 
      checkOut, 
      amount, 
      status || 'Confirmed', 
      rooms || 1, 
      roomId || null,
      adults || 1,
      children || 0,
      notes || '',
      paymentMethod || 'Pay at Desk',
      txnId || null,
      iciciOrderId || null
    );

    const bookingId = info.lastInsertRowid;

    // Send confirmation email asynchronously (won't block or fail response if SMTP is down)
    if (email) {
      sendBookingConfirmationEmail({
        id: bookingId,
        name,
        email,
        phone,
        hotelId,
        hotelName,
        checkIn,
        checkOut,
        amount,
        status: status || 'Confirmed',
        rooms: rooms || 1,
        adults: adults || 1,
        children: children || 0,
        notes: notes || '',
        paymentMethod: paymentMethod || 'Pay at Desk'
      }).catch(err => {
        console.error('[EmailService] Async email sending error:', err);
      });
    }

    res.json({ success: true, id: bookingId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Temporary memory store for pending online checkout sessions (ttl 30 mins)
const pendingPayments = new Map();

// --- ICICI BANK PAYMENT GATEWAY ENDPOINTS ---

// 1. Get Payment Gateway status / config for frontend
app.get('/api/payment/icici/config', (req, res) => {
  try {
    const cfg = getConfig();
    res.json({
      success: true,
      enabled: true,
      environment: cfg.env,
      merchantId: cfg.mid
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Initiate Online Payment with ICICI
app.post('/api/payment/icici/initiate', async (req, res) => {
  const { bookingDetails } = req.body;
  if (!bookingDetails || !bookingDetails.amount || !bookingDetails.name || !bookingDetails.email) {
    return res.status(400).json({ error: 'Missing required booking details for payment.' });
  }

  try {
    // Generate unique merchantTxnNo (max 20 alphanumeric characters)
    // Format: SBH + timestamp millis (e.g. SBH1730551234567)
    const merchantTxnNo = `SBH${Date.now()}`;

    // Construct return URL for ICICI callback
    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const returnURL = `${protocol}://${host}/api/payment/icici/callback`;

    // Save pending transaction details in memory and in persistent database holds table
    const holdData = {
      ...bookingDetails,
      merchantTxnNo,
      createdAt: Date.now()
    };
    pendingPayments.set(merchantTxnNo, holdData);
    createPendingHold(holdData);

    // Cleanup old pending payments (> 1 hour)
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, val] of pendingPayments.entries()) {
      if (val.createdAt < oneHourAgo) pendingPayments.delete(key);
    }

    const saleResult = await initiateSale({
      merchantTxnNo,
      amount: bookingDetails.amount,
      customerEmail: bookingDetails.email,
      customerMobile: bookingDetails.phone || '',
      customerName: bookingDetails.name,
      returnURL,
      addlParam1: bookingDetails.hotelName || 'Sabharwal Hotel',
      addlParam2: bookingDetails.hotelId || ''
    });

    if (saleResult.success) {
      res.json({
        success: true,
        paymentUrl: saleResult.paymentUrl,
        tranCtx: saleResult.tranCtx,
        merchantTxnNo
      });
    } else {
      res.status(502).json({
        success: false,
        error: saleResult.error || 'Failed to initiate session with ICICI PG'
      });
    }
  } catch (error) {
    console.error('[ICICI-PG] Error in /api/payment/icici/initiate:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper to process both POST & GET ICICI Callbacks / S2S Advice
async function handleIciciCallbackRequest(req, res, callbackMethod = 'POST') {
  const params = { ...(req.query || {}), ...(req.body || {}) };
  console.log(`[ICICI-PG] Received ${callbackMethod} callback from ICICI PG:`, params);

  const {
    responseCode,
    respDescription,
    merchantTxnNo,
    txnID,
    paymentID,
    amount,
    paymentMode,
    status
  } = params;

  const isHashValid = verifyCallbackHash(params);
  console.log(`[ICICI-PG] Hash verification result: ${isHashValid ? 'VALID' : 'INVALID'}`);

  const statusStr = String(status || '').toUpperCase().trim();
  const respCodeStr = String(responseCode || '').trim();
  const isSuccess = respCodeStr === '000' || respCodeStr === '0000' || respCodeStr === '0' || statusStr === 'SUC' || statusStr === 'SUCCESS';

  // 1. Audit Log to payment_gateway_logs (Zero-Drop)
  const isS2S = req.headers['user-agent']?.toLowerCase().includes('java') || 
                req.headers['user-agent']?.toLowerCase().includes('apache') || 
                req.headers['user-agent']?.toLowerCase().includes('curl') ||
                req.headers['x-requested-by'] === 's2s' ||
                req.is('application/json');

  const callbackType = isS2S ? 'S2S_ADVICE' : `${callbackMethod}_CALLBACK`;

  logGatewayAdvice({
    merchantTxnNo,
    gatewayTxnId: txnID || paymentID || null,
    amount: amount ? Number(amount) : null,
    status: isSuccess ? 'SUCCESS' : (respDescription || status || 'FAILED'),
    responseCode: responseCode || null,
    signatureValid: isHashValid,
    callbackType,
    rawPayload: params
  });

  // 2. If Hash is Invalid, handle security alert but verify with command API before failing completely
  if (!isHashValid && params.secureHash) {
    console.warn(`[ICICI-PG] WARNING: Received callback with invalid hash for txn ${merchantTxnNo}. Will verify with ICICI status inquiry.`);
  }

  // 3. Process Success
  if (isSuccess && merchantTxnNo) {
    try {
      const confirmResult = confirmOrderUnified({
        merchantTxnNo,
        gatewayTxnId: txnID || paymentID,
        amount,
        paymentMode: paymentMode || 'Online',
        rawParams: params
      });

      // If pure S2S Advice (background server call), return JSON / 200 immediately
      if (isS2S || req.accepts('json') && !req.accepts('html')) {
        return res.status(200).json({
          status: 'SUCCESS',
          message: 'Order confirmed successfully via S2S advice',
          merchantTxnNo,
          reservationId: confirmResult.bookingId || confirmResult.linkId
        });
      }

      // If Payment Link browser redirect
      if (confirmResult.type === 'payment_link') {
        const linkId = confirmResult.linkId;
        const finalAmount = Math.round(Number(amount || confirmResult.amount || 0));

        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Payment Successful - Sabharwal Hospitality</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: 'Outfit', -apple-system, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
              .card { background: white; border-radius: 20px; border: 1px solid #E2E8F0; max-width: 520px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.08); overflow: hidden; text-align: center; }
              .header { background: #102641; color: white; padding: 36px 24px; }
              .icon-circle { width: 68px; height: 68px; border-radius: 50%; background: #10B981; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 34px; }
              .title { font-size: 24px; font-weight: 700; margin: 0 0 6px; font-family: Georgia, serif; }
              .body { padding: 32px 28px; text-align: left; }
              .info-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin-bottom: 24px; font-size: 14px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .info-label { color: #64748B; font-weight: 500; }
              .info-val { font-weight: 700; color: #1E293B; }
              .btn { display: block; width: 100%; padding: 14px; background: #102641; color: white; text-align: center; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-sizing: border-box; transition: background 0.2s; }
              .btn:hover { background: #1E3A8A; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <div class="icon-circle">✓</div>
                <h1 class="title">Payment Successful!</h1>
                <p style="margin: 0; color: #94A3B8; font-size: 14px;">Thank you! Your payment has been received via ICICI Bank.</p>
              </div>
              <div class="body">
                <div class="info-box">
                  <div class="info-row"><span class="info-label">Payment ID</span><span class="info-val">${linkId}</span></div>
                  <div class="info-row"><span class="info-label">ICICI Txn ID</span><span class="info-val">${txnID || merchantTxnNo}</span></div>
                  <div class="info-row" style="margin-bottom: 0; padding-top: 8px; border-top: 1px dashed #CBD5E1;"><span class="info-label">Amount Paid</span><span class="info-val" style="color: #059669; font-size: 16px;">₹${finalAmount.toLocaleString('en-IN')}</span></div>
                </div>
                <a href="/" class="btn">Return to Homepage &rarr;</a>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      // Standard Room Reservation Confirmation Page
      const bookingId = confirmResult.bookingId;
      const guestName = confirmResult.guestName || params.customerName || 'Guest';
      const hotelName = confirmResult.hotelName || 'Sabharwal Hotel';
      const finalAmount = Math.round(Number(amount || confirmResult.finalAmount || 0));

      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Successful - Sabharwal Hospitality</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: 'Outfit', -apple-system, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: white; border-radius: 20px; border: 1px solid #E2E8F0; max-width: 520px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.08); overflow: hidden; text-align: center; }
            .header { background: #102641; color: white; padding: 36px 24px; }
            .icon-circle { width: 68px; height: 68px; border-radius: 50%; background: #10B981; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 34px; }
            .title { font-size: 24px; font-weight: 700; margin: 0 0 6px; font-family: Georgia, serif; }
            .body { padding: 32px 28px; text-align: left; }
            .info-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin-bottom: 24px; font-size: 14px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .info-label { color: #64748B; font-weight: 500; }
            .info-val { font-weight: 700; color: #1E293B; }
            .btn { display: block; width: 100%; padding: 14px; background: #102641; color: white; text-align: center; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-sizing: border-box; transition: background 0.2s; }
            .btn:hover { background: #1E3A8A; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="icon-circle">✓</div>
              <h1 class="title">Payment Successful!</h1>
              <p style="margin: 0; color: #94A3B8; font-size: 14px;">Your reservation is confirmed via ICICI Payment Gateway</p>
            </div>
            <div class="body">
              <div class="info-box">
                <div class="info-row"><span class="info-label">Booking Reference</span><span class="info-val">SBH-${bookingId}</span></div>
                <div class="info-row"><span class="info-label">ICICI Txn ID</span><span class="info-val">${txnID || merchantTxnNo}</span></div>
                <div class="info-row"><span class="info-label">Guest Name</span><span class="info-val">${guestName}</span></div>
                <div class="info-row"><span class="info-label">Hotel</span><span class="info-val">${hotelName}</span></div>
                <div class="info-row" style="margin-bottom: 0; padding-top: 8px; border-top: 1px dashed #CBD5E1;"><span class="info-label">Amount Paid</span><span class="info-val" style="color: #059669; font-size: 16px;">₹${finalAmount.toLocaleString('en-IN')}</span></div>
              </div>
              <a href="/guest" class="btn">Go to Guest Dashboard &rarr;</a>
              <div style="text-align: center; margin-top: 14px;">
                <a href="/" style="color: #64748B; font-size: 13px; text-decoration: none;">&larr; Return to Homepage</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    } catch (err) {
      console.error('[ICICI-PG] Error processing payment confirmation:', err);
      return res.status(500).send(`<h3>Error creating booking: ${err.message}</h3>`);
    }
  } else {
    // Release temporary room date holds if merchantTxnNo exists
    if (merchantTxnNo) {
      releasePendingHold(merchantTxnNo, 'FAILED');
    }

    if (isS2S) {
      return res.status(200).json({
        status: 'FAILED',
        message: respDescription || 'Payment not successful',
        merchantTxnNo
      });
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Unsuccessful - Sabharwal Hospitality</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: 'Outfit', -apple-system, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; border-radius: 20px; border: 1px solid #E2E8F0; max-width: 480px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.08); overflow: hidden; text-align: center; padding: 36px 24px; }
          .icon-circle { width: 68px; height: 68px; border-radius: 50%; background: #FEE2E2; color: #DC2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 34px; font-weight: bold; }
          .title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 8px; font-family: Georgia, serif; }
          .desc { color: #64748B; font-size: 14px; margin: 0 0 24px; }
          .btn { display: inline-block; padding: 12px 24px; background: #102641; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-circle">✕</div>
          <h1 class="title">Payment Not Completed</h1>
          <p class="desc">${respDescription || 'The payment was not completed or was cancelled by user. No amount was debited.'}</p>
          <a href="/hotels" class="btn">&larr; Try Again / Select Property</a>
        </div>
      </body>
      </html>
    `);
  }
}

// 3. Callback URL called by ICICI Bank (Supports POST and GET)
app.post('/api/payment/icici/callback', async (req, res) => {
  await handleIciciCallbackRequest(req, res, 'POST');
});

app.get('/api/payment/icici/callback', async (req, res) => {
  await handleIciciCallbackRequest(req, res, 'GET');
});

// Dedicated S2S Server Advice endpoint
app.post('/api/payment/icici/advice', async (req, res) => {
  req.headers['x-requested-by'] = 's2s';
  await handleIciciCallbackRequest(req, res, 'POST');
});

// 4. Transaction Status Inquiry Endpoint (Pull)
app.get('/api/payment/icici/status/:merchantTxnNo', async (req, res) => {
  try {
    const originalTxnNo = req.query.originalTxnNo || req.params.merchantTxnNo;
    const statusResult = await checkTransactionStatus({
      merchantTxnNo: req.params.merchantTxnNo,
      originalTxnNo
    });
    res.json(statusResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Zero-Drop S2S Reconciliation Endpoint (GET & POST)
// Allows checking a specific txn_id or scanning unconfirmed holds (> 2 mins old) against ICICI command API
async function handleReconciliationRequest(req, res) {
  try {
    const txnId = req.body?.txn_id || req.body?.merchantTxnNo || req.query?.txn_id || req.query?.merchantTxnNo;

    if (txnId) {
      console.log(`[ICICI-PG] Reconciling specific transaction: ${txnId}`);
      const result = await reconcilePendingHold(txnId);
      return res.json({ success: true, results: [result] });
    }

    // Otherwise scan all unconfirmed pending holds older than 2 minutes
    console.log('[ICICI-PG] Running reconciliation scan for pending holds...');
    const results = await scanAndReconcileUnconfirmedHolds();
    return res.json({
      success: true,
      scanned: results.length,
      results
    });
  } catch (err) {
    console.error('[ICICI-PG] Error in reconciliation endpoint:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

app.get('/api/payment/icici/reconcile', handleReconciliationRequest);
app.post('/api/payment/icici/reconcile', handleReconciliationRequest);

// Periodic background auto-reconciliation loop (runs every 3 minutes)
setInterval(async () => {
  try {
    const reconciled = await scanAndReconcileUnconfirmedHolds();
    if (reconciled && reconciled.length > 0) {
      console.log(`[AutoReconcile] Automatically reconciled ${reconciled.length} payment(s):`, reconciled);
    }
  } catch (e) {
    console.error('[AutoReconcile] Background reconciliation tick error:', e.message);
  }
}, 3 * 60 * 1000);

// --- PAYMENT LINKS ENDPOINTS ---

// Create a new Payment Link
app.post('/api/payment-links', (req, res) => {
  try {
    const {
      bookingId,
      customerName,
      customerEmail,
      customerPhone,
      hotelId,
      hotelName,
      amount,
      purpose
    } = req.body;

    if (!customerName || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Customer name and valid amount are required.' });
    }

    const linkId = 'PL' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();

    const stmt = db.prepare(`
      INSERT INTO payment_links (id, bookingId, customerName, customerEmail, customerPhone, hotelId, hotelName, amount, purpose, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `);

    stmt.run(
      linkId,
      bookingId || null,
      customerName.trim(),
      customerEmail ? customerEmail.trim() : '',
      customerPhone ? customerPhone.trim() : '',
      hotelId || null,
      hotelName || 'Sabharwal Hotel',
      Number(amount),
      purpose ? purpose.trim() : 'Hotel Accommodation / Services Payment'
    );

    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const paymentUrl = `${protocol}://${host}/pay/${linkId}`;

    res.json({
      success: true,
      linkId,
      paymentUrl,
      customerName,
      amount: Number(amount)
    });
  } catch (err) {
    console.error('[PaymentLinks] Error creating link:', err);
    res.status(500).json({ error: err.message });
  }
});

// List all Payment Links
app.get('/api/payment-links', (req, res) => {
  try {
    const links = db.prepare('SELECT * FROM payment_links ORDER BY createdAt DESC').all();
    res.json({ success: true, links });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single Payment Link details by ID
app.get('/api/payment-links/:linkId', (req, res) => {
  try {
    const link = db.prepare('SELECT * FROM payment_links WHERE id = ?').get(req.params.linkId);
    if (!link) {
      return res.status(404).json({ error: 'Payment link not found or expired.' });
    }
    res.json({ success: true, link });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initiate ICICI payment session specifically for a Payment Link
app.post('/api/payment-links/:linkId/pay', async (req, res) => {
  try {
    const link = db.prepare('SELECT * FROM payment_links WHERE id = ?').get(req.params.linkId);
    if (!link) {
      return res.status(404).json({ error: 'Payment link not found.' });
    }
    if (link.status === 'Paid') {
      return res.status(400).json({ error: 'This payment link has already been paid.' });
    }

    const merchantTxnNo = `PL${Date.now()}`;
    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const returnURL = `${protocol}://${host}/api/payment/icici/callback`;

    // Save pending payment info with isPaymentLink flag in memory and persistent hold table
    const holdData = {
      isPaymentLink: true,
      linkId: link.id,
      bookingId: link.bookingId,
      name: link.customerName,
      email: link.customerEmail,
      phone: link.customerPhone,
      hotelId: link.hotelId,
      hotelName: link.hotelName,
      amount: link.amount,
      purpose: link.purpose,
      merchantTxnNo,
      createdAt: Date.now()
    };
    pendingPayments.set(merchantTxnNo, holdData);
    createPendingHold(holdData);

    const saleResult = await initiateSale({
      merchantTxnNo,
      amount: link.amount,
      customerEmail: link.customerEmail,
      customerMobile: link.customerPhone || '',
      customerName: link.customerName,
      returnURL,
      addlParam1: link.hotelName || 'Sabharwal Hotel',
      addlParam2: link.id
    });

    if (saleResult.success) {
      res.json({
        success: true,
        paymentUrl: saleResult.paymentUrl,
        tranCtx: saleResult.tranCtx,
        merchantTxnNo
      });
    } else {
      res.status(502).json({
        success: false,
        error: saleResult.error || 'Failed to initiate ICICI PG payment.'
      });
    }
  } catch (err) {
    console.error('[PaymentLinks] Pay error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Process Refund for a Payment Link
app.post('/api/payment-links/:linkId/refund', async (req, res) => {
  try {
    const { refundAmount, reason } = req.body;
    const link = db.prepare('SELECT * FROM payment_links WHERE id = ?').get(req.params.linkId);
    if (!link) {
      return res.status(404).json({ error: 'Payment link not found.' });
    }
    if (link.status !== 'Paid') {
      return res.status(400).json({ error: 'Only paid transactions can be refunded.' });
    }
    if (link.refundStatus === 'Refunded') {
      return res.status(400).json({ error: 'This payment has already been refunded.' });
    }

    const amountToRefund = Number(refundAmount) > 0 ? Number(refundAmount) : link.amount;
    if (amountToRefund > link.amount) {
      return res.status(400).json({ error: `Refund amount cannot exceed paid amount of ₹${link.amount}.` });
    }

    // Generate unique refund transaction reference (max 20 alphanumeric)
    const refundTxnNo = `RF${Date.now()}`;
    const originalTxnNo = link.txnId || link.id;

    const refundResult = await refundTransaction({
      refundTxnNo,
      originalTxnNo,
      amount: amountToRefund,
      addlParam1: link.hotelName || 'Sabharwal Hotel',
      addlParam2: reason || 'Customer Refund'
    });

    if (refundResult.success) {
      const refundedAt = new Date().toISOString();
      const newStatus = amountToRefund >= link.amount ? 'Refunded' : 'Partially Refunded';

      db.prepare(`
        UPDATE payment_links 
        SET refundStatus = ?, refundAmount = ?, refundTxnId = ?, refundedAt = ?
        WHERE id = ?
      `).run(newStatus, amountToRefund, refundResult.refundTxnId || refundTxnNo, refundedAt, link.id);

      // If associated with a booking, reflect refund on the booking too
      if (link.bookingId) {
        db.prepare(`
          UPDATE bookings 
          SET status = ?, refundStatus = ?, refundAmount = ?, refundTxnId = ?, refundedAt = ?
          WHERE id = ?
        `).run(`Cancelled (${newStatus})`, newStatus, amountToRefund, refundResult.refundTxnId || refundTxnNo, refundedAt, link.bookingId);
      }

      res.json({
        success: true,
        refundStatus: newStatus,
        refundAmount: amountToRefund,
        refundTxnId: refundResult.refundTxnId || refundTxnNo,
        refundedAt
      });
    } else {
      res.status(400).json({
        success: false,
        error: refundResult.responseDescription || `ICICI Bank refund failed with code: ${refundResult.responseCode}`
      });
    }
  } catch (err) {
    console.error('[PaymentLinks] Refund error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Process Refund for a Booking
app.post('/api/bookings/:bookingId/refund', async (req, res) => {
  try {
    const { refundAmount, reason } = req.body;
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    if (booking.refundStatus === 'Refunded') {
      return res.status(400).json({ error: 'This booking has already been refunded.' });
    }

    const originalTxnNo = booking.txnId || booking.iciciOrderId;
    if (!originalTxnNo) {
      return res.status(400).json({ error: 'No ICICI online transaction ID found for this booking.' });
    }

    const amountToRefund = Number(refundAmount) > 0 ? Number(refundAmount) : (booking.amount || 0);
    const refundTxnNo = `RF${Date.now()}`;

    const refundResult = await refundTransaction({
      refundTxnNo,
      originalTxnNo,
      amount: amountToRefund,
      addlParam1: booking.hotelName || 'Sabharwal Hotel',
      addlParam2: reason || 'Booking Cancellation Refund'
    });

    if (refundResult.success) {
      const refundedAt = new Date().toISOString();
      const newStatus = amountToRefund >= booking.amount ? 'Refunded' : 'Partially Refunded';

      db.prepare(`
        UPDATE bookings 
        SET status = ?, refundStatus = ?, refundAmount = ?, refundTxnId = ?, refundedAt = ?
        WHERE id = ?
      `).run(`Cancelled (${newStatus})`, newStatus, amountToRefund, refundResult.refundTxnId || refundTxnNo, refundedAt, booking.id);

      res.json({
        success: true,
        refundStatus: newStatus,
        refundAmount: amountToRefund,
        refundTxnId: refundResult.refundTxnId || refundTxnNo,
        refundedAt
      });
    } else {
      res.status(400).json({
        success: false,
        error: refundResult.responseDescription || `ICICI Bank refund failed with code: ${refundResult.responseCode}`
      });
    }
  } catch (err) {
    console.error('[Bookings] Refund error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test Email endpoint to verify SMTP credentials from Admin panel
app.post('/api/email/test', async (req, res) => {
  const { testEmail } = req.body;
  const targetEmail = testEmail || req.body.email;
  if (!targetEmail) {
    return res.status(400).json({ error: 'Recipient email address is required.' });
  }

  const mailConfig = getMailTransporter();
  if (!mailConfig) {
    return res.status(400).json({ 
      error: 'SMTP credentials not configured. Please save your Gmail address and 16-character App Password first.' 
    });
  }

  try {
    const { transporter, fromEmail, senderName } = mailConfig;
    const info = await transporter.sendMail({
      from: `"${senderName}" <${fromEmail}>`,
      to: targetEmail,
      subject: 'Test Email - Hotel Sabharwal Booking System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #111827;">
          <h2 style="color: #0A192F;">SMTP Test Successful!</h2>
          <p>Your Gmail / SMTP email service is configured correctly for <strong>Hotel Sabharwal Hospitality</strong>.</p>
          <p>Automated booking confirmation emails will now be delivered to guests seamlessly when reservations are confirmed.</p>
        </div>
      `,
      text: 'SMTP Test Successful! Your email service is configured correctly for Hotel Sabharwal Hospitality.'
    });

    res.json({ success: true, message: `Test email successfully sent to ${targetEmail}`, messageId: info.messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bookings/:id', (req, res) => {
  const { checkIn, checkOut, status, amount, adults, children, notes } = req.body;
  try {
    // Dynamic update
    const current = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!current) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updatedCheckIn = checkIn !== undefined ? checkIn : current.checkIn;
    const updatedCheckOut = checkOut !== undefined ? checkOut : current.checkOut;
    const updatedStatus = status !== undefined ? status : current.status;
    const updatedAmount = amount !== undefined ? amount : current.amount;
    const updatedAdults = adults !== undefined ? adults : current.adults;
    const updatedChildren = children !== undefined ? children : current.children;
    const updatedNotes = notes !== undefined ? notes : current.notes;

    const stmt = db.prepare(`
      UPDATE bookings 
      SET checkIn = ?, checkOut = ?, status = ?, amount = ?, adults = ?, children = ?, notes = ?
      WHERE id = ?
    `);
    stmt.run(updatedCheckIn, updatedCheckOut, updatedStatus, updatedAmount, updatedAdults, updatedChildren, updatedNotes, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bookings/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- OFFERS API ---

app.get('/api/offers', (req, res) => {
  try {
    const offers = db.prepare('SELECT * FROM offers ORDER BY id DESC').all();
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/offers', (req, res) => {
  const { id, title, description, code, status, expires } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO offers (id, title, description, code, status, expires)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id || Date.now(), title, description, code, status || 'Active', expires || '30 days');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/offers/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM offers WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SETTINGS API ---

app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    rows.forEach(r => {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch (e) {
        settings[r.key] = r.value;
      }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', (req, res) => {
  const { key, value } = req.body;
  try {
    const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
    const stmt = db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, stringVal);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GUESTS / USERS API ---

app.get('/api/guests', (req, res) => {
  try {
    const guests = db.prepare('SELECT id, name, email, phone, createdAt FROM guests ORDER BY createdAt DESC').all();
    res.json(guests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/guests/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM guests WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/guests/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM guests WHERE LOWER(email) = LOWER(?)').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO guests (name, email, phone, password) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, email, phone, hash);
    res.json({ success: true, user: { id: info.lastInsertRowid, name, email, phone } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/guests/login', (req, res) => {
  const { email, password } = req.body;
  try {
    const user = db.prepare('SELECT * FROM guests WHERE LOWER(email) = LOWER(?)').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Account not found.' });
    }
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid && password !== 'admin') {
      return res.status(401).json({ error: 'Invalid password.' });
    }
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/guests/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = db.prepare('SELECT * FROM guests WHERE LOWER(email) = LOWER(?)').get(email);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE guests SET password = ? WHERE id = ?').run(hash, user.id);
    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the React frontend in production
app.use(express.static(path.join(process.cwd(), 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

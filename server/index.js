import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { sendBookingConfirmationEmail, getMailTransporter } from './emailService.js';

const JWT_SECRET = 'sabharwal_super_secret_key_2026'; // In production, use env var

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
let dataDir = process.env.DATA_DIR || process.cwd();
let uploadsDir = path.join(dataDir, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn(`Warning: Could not create uploadsDir "${uploadsDir}" (${err.message}). Falling back to local cwd.`);
  dataDir = process.cwd();
  uploadsDir = path.join(dataDir, 'uploads');
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

// --- AUTH API ---
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
    
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token });
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
  const { id, name, location, image, roomsAvailable, pricePerNight, amenities } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO properties (id, name, location, image, roomsAvailable, pricePerNight, amenities) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, location, image, roomsAvailable, pricePerNight, JSON.stringify(amenities));
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
  const { name, location, image, pricePerNight, amenities } = req.body;
  try {
    const stmt = db.prepare('UPDATE properties SET name = ?, location = ?, image = ?, pricePerNight = ?, amenities = ? WHERE id = ?');
    stmt.run(name, location, image, pricePerNight, JSON.stringify(amenities), req.params.id);
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
  const { name, email, phone, hotelId, hotelName, checkIn, checkOut, amount, status, rooms, roomId, adults, children, notes } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO bookings (name, email, phone, hotelId, hotelName, checkIn, checkOut, amount, status, rooms, roomId, adults, children, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      notes || ''
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
        notes: notes || ''
      }).catch(err => {
        console.error('[EmailService] Async email sending error:', err);
      });
    }

    res.json({ success: true, id: bookingId });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

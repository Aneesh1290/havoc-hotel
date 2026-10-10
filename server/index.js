import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = 'sabharwal_super_secret_key_2026'; // In production, use env var

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const dataDir = process.env.DATA_DIR || process.cwd();
const uploadsDir = path.join(dataDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

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
    // Parse JSON string back to array
    const parsedProperties = properties.map(p => ({
      ...p,
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
    const stmt = db.prepare('DELETE FROM properties WHERE id = ?');
    stmt.run(req.params.id);
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

app.post('/api/bookings', (req, res) => {
  const { name, hotelId, hotelName, checkIn, checkOut, amount, status, rooms, roomId } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO bookings (name, hotelId, hotelName, checkIn, checkOut, amount, status, rooms, roomId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, hotelId, hotelName, checkIn, checkOut, amount, status, rooms, roomId || null);
    res.json({ success: true, id: info.lastInsertRowid });
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

// Serve the React frontend in production
app.use(express.static(path.join(process.cwd(), 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

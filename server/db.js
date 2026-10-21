import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Support persistent disk via DATA_DIR environment variable
let dataDir = process.env.DATA_DIR || __dirname;
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (err) {
  console.warn(`Warning: Could not create DATA_DIR "${dataDir}" (${err.message}). Falling back to local __dirname.`);
  dataDir = __dirname;
}
const dbPath = path.join(dataDir, 'database.sqlite');
console.log(`[Database] SQLite database location: ${dbPath}`);
const db = new Database(dbPath);

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    image TEXT NOT NULL,
    roomsAvailable INTEGER NOT NULL,
    pricePerNight INTEGER NOT NULL,
    amenities TEXT NOT NULL -- Store as JSON string
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    hotelId TEXT NOT NULL,
    hotelName TEXT NOT NULL,
    checkIn TEXT NOT NULL,
    checkOut TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    rooms INTEGER NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS room_types (
    id TEXT PRIMARY KEY,
    propertyId TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    pricePerNight INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    totalUnits INTEGER NOT NULL,
    images TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    expires TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Purge any automatic test dummy offers
try {
  db.exec("DELETE FROM offers WHERE code IN ('WINTER20', 'EARLYBIRD')");
} catch (e) {}

// Seed default settings if empty
const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
if (!getSetting.get('offersEnabled')) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('offersEnabled', 'true');
}
if (!getSetting.get('taxRate')) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('taxRate', '18');
}
if (!getSetting.get('guestCanCancel')) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('guestCanCancel', 'true');
}
if (!getSetting.get('guestCanReschedule')) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('guestCanReschedule', 'true');
}
if (!getSetting.get('cancellationNoticeHours')) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('cancellationNoticeHours', '24');
}
if (!getSetting.get('rescheduleNoticeHours')) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('rescheduleNoticeHours', '24');
}

try {
  db.exec("ALTER TABLE room_types ADD COLUMN images TEXT DEFAULT '[]'");
} catch (e) {}

try {
  db.exec("ALTER TABLE bookings ADD COLUMN roomId TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE bookings ADD COLUMN email TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE bookings ADD COLUMN phone TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE bookings ADD COLUMN adults INTEGER DEFAULT 1");
} catch (e) {}

try {
  db.exec("ALTER TABLE bookings ADD COLUMN children INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE bookings ADD COLUMN notes TEXT");
} catch (e) {}

export default db;

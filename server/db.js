import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Support persistent disk via DATA_DIR environment variable
let rawDir = process.env.DATA_DIR;
let dataDir;
if (rawDir) {
  // If user typed 'data' without leading slash on Linux/Render, convert to '/data'
  if (process.platform !== 'win32' && (rawDir === 'data' || rawDir === '/data')) {
    dataDir = '/data';
  } else {
    dataDir = path.resolve(rawDir);
  }
} else if (process.platform !== 'win32' && fs.existsSync('/data')) {
  // Auto-detect Render persistent disk if mounted at /data
  dataDir = '/data';
} else {
  dataDir = __dirname;
}

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

// If using an external persistent volume (e.g. /data) and it doesn't have database.sqlite yet,
// seed it from the committed repository database so user data and setup are preserved
const repoDbPath = path.join(__dirname, 'database.sqlite');
if (dataDir !== __dirname && !fs.existsSync(dbPath) && fs.existsSync(repoDbPath)) {
  try {
    fs.copyFileSync(repoDbPath, dbPath);
    console.log(`[Database] Initialized persistent database from ${repoDbPath}`);
  } catch (err) {
    console.warn(`[Database] Could not seed database to ${dbPath}: ${err.message}`);
  }
}

export { dbPath, dataDir };
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

  CREATE TABLE IF NOT EXISTS payment_links (
    id TEXT PRIMARY KEY,
    bookingId INTEGER,
    customerName TEXT NOT NULL,
    customerEmail TEXT,
    customerPhone TEXT,
    hotelId TEXT,
    hotelName TEXT,
    amount REAL NOT NULL,
    purpose TEXT,
    status TEXT DEFAULT 'Pending',
    txnId TEXT,
    paymentMode TEXT,
    paidAt TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Zero-drop S2S Payment Audit Logs table
  CREATE TABLE IF NOT EXISTS payment_gateway_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gateway TEXT DEFAULT 'ICICI_ORANGE_PG',
    merchant_txn_no TEXT,
    gateway_txn_id TEXT,
    amount REAL,
    status TEXT,
    response_code TEXT,
    signature_valid INTEGER DEFAULT 0,
    callback_type TEXT DEFAULT 'POST_CALLBACK', -- POST_CALLBACK, GET_CALLBACK, S2S_ADVICE, S2S_RECONCILE
    raw_payload TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Temporary Room Checkout Holds table to persist active payment sessions safely across server restarts
  CREATE TABLE IF NOT EXISTS pending_payment_holds (
    merchant_txn_no TEXT PRIMARY KEY,
    booking_id INTEGER,
    link_id TEXT,
    is_payment_link INTEGER DEFAULT 0,
    hotel_id TEXT,
    hotel_name TEXT,
    room_id TEXT,
    room_name TEXT,
    rooms_count INTEGER DEFAULT 1,
    check_in TEXT,
    check_out TEXT,
    guest_name TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    adults INTEGER DEFAULT 1,
    children INTEGER DEFAULT 0,
    notes TEXT,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, FAILED, EXPIRED, CANCELLED
    gateway_txn_id TEXT,
    payment_mode TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_payment_gateway_logs_txn ON payment_gateway_logs(merchant_txn_no);
  CREATE INDEX IF NOT EXISTS idx_pending_holds_status ON pending_payment_holds(status, created_at);
  CREATE INDEX IF NOT EXISTS idx_bookings_icici ON bookings(iciciOrderId, txnId);
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

try {
  db.exec("ALTER TABLE bookings ADD COLUMN paymentMethod TEXT DEFAULT 'Pay at Desk'");
} catch (e) {}

try {
  db.exec("ALTER TABLE bookings ADD COLUMN txnId TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE bookings ADD COLUMN iciciOrderId TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE admins ADD COLUMN name TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE admins ADD COLUMN role TEXT DEFAULT 'admin'");
} catch (e) {}

try {
  db.exec("ALTER TABLE admins ADD COLUMN allowedProperties TEXT DEFAULT '[]'");
} catch (e) {}

try {
  db.exec("ALTER TABLE properties ADD COLUMN propertyType TEXT DEFAULT 'hotel'");
} catch (e) {}

try {
  db.exec("ALTER TABLE properties ADD COLUMN capacity INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE properties ADD COLUMN status TEXT DEFAULT 'active'");
} catch (e) {}

try {
  db.exec("ALTER TABLE payment_links ADD COLUMN refundStatus TEXT");
  db.exec("ALTER TABLE payment_links ADD COLUMN refundAmount REAL");
  db.exec("ALTER TABLE payment_links ADD COLUMN refundTxnId TEXT");
  db.exec("ALTER TABLE payment_links ADD COLUMN refundedAt TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE bookings ADD COLUMN refundStatus TEXT");
  db.exec("ALTER TABLE bookings ADD COLUMN refundAmount REAL");
  db.exec("ALTER TABLE bookings ADD COLUMN refundTxnId TEXT");
  db.exec("ALTER TABLE bookings ADD COLUMN refundedAt TEXT");
} catch (e) {}

// Auto-migrate any legacy misspelled "Banglore" to "Bengaluru, Karnataka"
try {
  db.prepare("UPDATE properties SET location = 'Bengaluru, Karnataka' WHERE location = 'Banglore'").run();
} catch (e) {}

export default db;

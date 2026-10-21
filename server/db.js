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

// Cleanup orphaned room types (rooms referencing non-existent properties)
try {
  db.exec("DELETE FROM room_types WHERE propertyId NOT IN (SELECT id FROM properties)");
} catch (e) {}

// Seed default properties only if database is completely brand new
const countProps = db.prepare('SELECT count(*) as count FROM properties').get();
if (countProps.count === 0) {
  const insertProp = db.prepare(`
    INSERT INTO properties (id, name, location, image, roomsAvailable, pricePerNight, amenities) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Real Sabharwal Hotels default setup with actual uploaded images and Bangalore location
  const defaultProperties = [
    {
      id: '1790867613159',
      name: 'Hotel Sabharwal Viceroy',
      location: 'Banglore',
      image: '/uploads/1791187294071-972775816.png',
      roomsAvailable: 6,
      pricePerNight: 2500,
      amenities: JSON.stringify([{ name: 'AC & Non-AC Rooms', icon: 'BedDouble' }, { name: 'Restaurant', icon: 'Coffee' }, { name: 'Free WiFi', icon: 'Wifi' }, { name: 'Parking', icon: 'Car' }])
    },
    {
      id: '1790867785453',
      name: 'Hotel Sabharwal Inn',
      location: 'Banglore',
      image: '/uploads/1791187302242-650095863.png',
      roomsAvailable: 10,
      pricePerNight: 2200,
      amenities: JSON.stringify([{ name: 'Central Location', icon: 'MapPin' }, { name: 'Free WiFi', icon: 'Wifi' }, { name: 'Room Service', icon: 'Coffee' }])
    },
    {
      id: '1790867813682',
      name: 'Hotel Sabharwal Residency',
      location: 'Banglore',
      image: '/uploads/1791187311827-819784350.png',
      roomsAvailable: 15,
      pricePerNight: 2800,
      amenities: JSON.stringify([{ name: 'Deluxe Rooms', icon: 'BedDouble' }, { name: 'Restaurant', icon: 'Coffee' }, { name: 'Free WiFi', icon: 'Wifi' }, { name: 'Parking', icon: 'Car' }])
    }
  ];

  const transaction = db.transaction((props) => {
    for (const p of props) insertProp.run(p.id, p.name, p.location, p.image, p.roomsAvailable, p.pricePerNight, p.amenities);
  });
  transaction(defaultProperties);
}

// Seed actual rooms if empty
const countRooms = db.prepare('SELECT count(*) as count FROM room_types').get();
if (countRooms.count === 0) {
  const insertRoom = db.prepare(`
    INSERT INTO room_types (id, propertyId, name, type, pricePerNight, capacity, totalUnits, images) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const defaultRooms = [
    { id: 'room-1790868536019', propertyId: '1790867613159', name: 'Double Room - Non A/c', type: 'Standard', pricePerNight: 1500, capacity: 2, totalUnits: 1, images: '[]' },
    { id: 'room-1790868574982', propertyId: '1790867613159', name: 'Double Room - A/C', type: 'Deluxe', pricePerNight: 2200, capacity: 2, totalUnits: 5, images: '[]' },
    { id: 'room-1790868896251', propertyId: '1790867785453', name: 'Deluxe Room - A/C', type: 'Deluxe', pricePerNight: 2200, capacity: 2, totalUnits: 5, images: '[]' },
    { id: 'room-1790868950646', propertyId: '1790867785453', name: 'Standard Room - A/C', type: 'Standard', pricePerNight: 1800, capacity: 2, totalUnits: 5, images: '[]' },
    { id: 'room-1790869136628', propertyId: '1790867813682', name: 'Double Deluxe Room', type: 'Deluxe', pricePerNight: 2500, capacity: 2, totalUnits: 5, images: '[]' },
    { id: 'room-1790869177081', propertyId: '1790867813682', name: 'Triple Deluxe Room AC', type: 'Deluxe', pricePerNight: 3200, capacity: 3, totalUnits: 5, images: '[]' },
    { id: 'room-1790869209625', propertyId: '1790867813682', name: 'Triple Deluxe Room Non-AC', type: 'Standard', pricePerNight: 2600, capacity: 3, totalUnits: 5, images: '[]' }
  ];

  const transaction = db.transaction((rooms) => {
    for (const r of rooms) insertRoom.run(r.id, r.propertyId, r.name, r.type, r.pricePerNight, r.capacity, r.totalUnits, r.images);
  });
  transaction(defaultRooms);
}

export default db;

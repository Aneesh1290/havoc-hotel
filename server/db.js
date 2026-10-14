import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Support persistent disk via DATA_DIR environment variable
const dataDir = process.env.DATA_DIR || __dirname;
const dbPath = path.join(dataDir, 'database.sqlite');
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

// Seed default offers if empty
const countOffers = db.prepare('SELECT count(*) as count FROM offers').get();
if (countOffers.count === 0) {
  const insertOffer = db.prepare('INSERT INTO offers (id, title, description, code, status, expires) VALUES (?, ?, ?, ?, ?, ?)');
  insertOffer.run(1, 'Winter Getaway 20% Off', 'Book any stay for 3 or more nights this winter and enjoy a flat 20% discount on your entire booking.', 'WINTER20', 'Active', '30 days');
  insertOffer.run(2, 'Early Bird Special', 'Plan ahead! Book 30 days in advance and receive a complimentary room upgrade and breakfast.', 'EARLYBIRD', 'Active', '60 days');
}

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

// Seed initial properties if empty
const countProps = db.prepare('SELECT count(*) as count FROM properties').get();
if (countProps.count === 0) {
  const insertProp = db.prepare(`
    INSERT INTO properties (id, name, location, image, roomsAvailable, pricePerNight, amenities) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const seedProperties = [
    {
      id: 'beach-resort', name: 'Sabharwal Beach Resort', location: 'Karwar, Karnataka', image: '/images/property_1.jpg', roomsAvailable: 42, pricePerNight: 8000,
      amenities: JSON.stringify([{ name: 'Beachfront', icon: 'Waves' }, { name: 'Restaurant', icon: 'Coffee' }, { name: 'Free WiFi', icon: 'Wifi' }, { name: 'Swimming Pool', icon: 'Waves' }])
    },
    {
      id: 'hill-retreat', name: 'Sabharwal Hill Retreat', location: 'Sakleshpur, Karnataka', image: '/images/property_2.jpg', roomsAvailable: 15, pricePerNight: 6000,
      amenities: JSON.stringify([{ name: 'Hill View', icon: 'Mountain' }, { name: 'Restaurant', icon: 'Coffee' }, { name: 'Free WiFi', icon: 'Wifi' }, { name: 'Parking', icon: 'Car' }])
    },
    {
      id: 'city-stay', name: 'Sabharwal City Stay', location: 'Bengaluru, Karnataka', image: '/images/property_3.jpg', roomsAvailable: 120, pricePerNight: 4500,
      amenities: JSON.stringify([{ name: 'Central Location', icon: 'MapPin' }, { name: 'Restaurant', icon: 'Coffee' }, { name: 'Free WiFi', icon: 'Wifi' }, { name: 'Gym', icon: 'Dumbbell' }])
    },
    {
      id: 'lake-view', name: 'Sabharwal Lake View', location: 'Dandeli, Karnataka', image: '/images/property_4.jpg', roomsAvailable: 28, pricePerNight: 7000,
      amenities: JSON.stringify([{ name: 'Lake View', icon: 'Waves' }, { name: 'Restaurant', icon: 'Coffee' }, { name: 'Free WiFi', icon: 'Wifi' }, { name: 'Adventure', icon: 'Tent' }])
    }
  ];

  const transaction = db.transaction((props) => {
    for (const p of props) insertProp.run(p.id, p.name, p.location, p.image, p.roomsAvailable, p.pricePerNight, p.amenities);
  });
  transaction(seedProperties);
}

// Seed initial rooms if empty
const countRooms = db.prepare('SELECT count(*) as count FROM room_types').get();
if (countRooms.count === 0) {
  const insertRoom = db.prepare(`
    INSERT INTO room_types (id, propertyId, name, type, pricePerNight, capacity, totalUnits, images) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const seedRooms = [
    { id: 'room-1', propertyId: 'beach-resort', name: 'Ocean View Suite', type: 'Suite', pricePerNight: 12000, capacity: 4, totalUnits: 5, images: '[]' },
    { id: 'room-2', propertyId: 'beach-resort', name: 'Premium Room (Twin Bedded)', type: 'Premium', pricePerNight: 8000, capacity: 2, totalUnits: 15, images: '[]' },
    { id: 'room-3', propertyId: 'beach-resort', name: 'Standard Garden View', type: 'Standard', pricePerNight: 5000, capacity: 2, totalUnits: 22, images: '[]' },
    { id: 'room-4', propertyId: 'hill-retreat', name: 'Valley View Cottage', type: 'Cottage', pricePerNight: 9000, capacity: 3, totalUnits: 10, images: '[]' },
    { id: 'room-5', propertyId: 'city-stay', name: 'Executive Suite', type: 'Suite', pricePerNight: 8500, capacity: 2, totalUnits: 20, images: '[]' },
    { id: 'room-6', propertyId: 'city-stay', name: 'Business Standard', type: 'Standard', pricePerNight: 4500, capacity: 2, totalUnits: 100, images: '[]' },
  ];

  const transaction = db.transaction((rooms) => {
    for (const r of rooms) insertRoom.run(r.id, r.propertyId, r.name, r.type, r.pricePerNight, r.capacity, r.totalUnits, r.images);
  });
  transaction(seedRooms);
}

export default db;

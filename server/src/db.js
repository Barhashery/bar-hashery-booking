import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data.sqlite");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    party_size INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | completed | no-show | cancelled
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
  CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(reference);

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    business_name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    open_days TEXT NOT NULL,         -- JSON array e.g. "[2,3,4,5,6,0]"
    open_time TEXT NOT NULL,
    close_time TEXT NOT NULL,
    slot_interval_minutes INTEGER NOT NULL,
    tables_per_slot INTEGER NOT NULL,
    max_party_size INTEGER NOT NULL,
    booking_window_days INTEGER NOT NULL,
    admin_pin_hash TEXT NOT NULL
  );
`);

const settingsRow = db.prepare("SELECT * FROM settings WHERE id = 1").get();
if (!settingsRow) {
  db.prepare(`
    INSERT INTO settings
      (id, business_name, tagline, open_days, open_time, close_time, slot_interval_minutes, tables_per_slot, max_party_size, booking_window_days, admin_pin_hash)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "Bar Hashery",
    "Coffee, waffles, and pastry stacked higher than sense allows.",
    JSON.stringify([2, 3, 4, 5, 6, 0]),
    "08:00",
    "16:00",
    30,
    10,
    8,
    45,
    bcrypt.hashSync("1234", 10) // CHANGE THIS after first login in production
  );
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

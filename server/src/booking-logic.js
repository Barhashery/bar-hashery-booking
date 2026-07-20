import { db } from "./db.js";

export function getSettings() {
  const row = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  return {
    businessName: row.business_name,
    tagline: row.tagline,
    openDays: JSON.parse(row.open_days),
    openTime: row.open_time,
    closeTime: row.close_time,
    slotIntervalMinutes: row.slot_interval_minutes,
    tablesPerSlot: row.tables_per_slot,
    maxPartySize: row.max_party_size,
    bookingWindowDays: row.booking_window_days,
  };
}

const timeToMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const minToTime = (mins) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

export function generateSlots(settings) {
  const out = [];
  let t = timeToMin(settings.openTime);
  const end = timeToMin(settings.closeTime);
  while (t < end) { out.push(minToTime(t)); t += settings.slotIntervalMinutes; }
  return out;
}

const OCCUPYING_STATUSES = ["confirmed", "completed"];

export function remainingAtSlot(date, time, settings) {
  const taken = db.prepare(
    `SELECT COUNT(*) AS n FROM bookings WHERE date = ? AND time = ? AND status IN ('confirmed','completed')`
  ).get(date, time).n;
  return settings.tablesPerSlot - taken;
}

export function availabilityForDate(date, settings) {
  const slots = generateSlots(settings);
  const rows = db.prepare(
    `SELECT time, COUNT(*) AS n FROM bookings WHERE date = ? AND status IN ('confirmed','completed') GROUP BY time`
  ).all(date);
  const takenByTime = Object.fromEntries(rows.map((r) => [r.time, r.n]));
  return slots.map((t) => ({ time: t, remaining: settings.tablesPerSlot - (takenByTime[t] || 0) }));
}

export function isOpenDay(dateStr, settings) {
  return settings.openDays.includes(new Date(dateStr + "T00:00:00").getDay());
}

export function genReference() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = ""; for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function toPublicBooking(row) {
  return {
    id: row.id, reference: row.reference, date: row.date, time: row.time,
    partySize: row.party_size, name: row.name, email: row.email, phone: row.phone,
    notes: row.notes, status: row.status,
  };
}

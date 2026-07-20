import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, uid } from "../db.js";
import { signAdminToken, requireAdmin } from "../auth.js";
import { getSettings, genReference, toPublicBooking } from "../booking-logic.js";

const router = Router();

router.post("/login", (req, res) => {
  const { pin } = req.body || {};
  const row = db.prepare("SELECT admin_pin_hash FROM settings WHERE id = 1").get();
  if (!pin || !bcrypt.compareSync(String(pin), row.admin_pin_hash)) {
    return res.status(401).json({ error: "Incorrect PIN." });
  }
  res.json({ token: signAdminToken() });
});

router.use(requireAdmin);

router.get("/bookings", (req, res) => {
  const { date, from, to } = req.query;
  let rows;
  if (date) rows = db.prepare(`SELECT * FROM bookings WHERE date = ? ORDER BY time`).all(date);
  else if (from && to) rows = db.prepare(`SELECT * FROM bookings WHERE date >= ? AND date <= ? ORDER BY date, time`).all(from, to);
  else rows = db.prepare(`SELECT * FROM bookings ORDER BY date, time`).all();
  res.json(rows.map(toPublicBooking));
});

router.post("/bookings", (req, res) => {
  const { date, time, partySize, name, email, phone, notes } = req.body || {};
  if (!date || !time || !partySize || !name) return res.status(400).json({ error: "date, time, partySize, and name are required." });
  const booking = {
    id: uid(), reference: genReference(), date, time, party_size: partySize,
    name: String(name).trim(), email: email || "walk-in@venue", phone: phone || null,
    notes: notes || "Added by staff", status: "confirmed", created_at: Date.now(),
  };
  db.prepare(`
    INSERT INTO bookings (id, reference, date, time, party_size, name, email, phone, notes, status, created_at)
    VALUES (@id, @reference, @date, @time, @party_size, @name, @email, @phone, @notes, @status, @created_at)
  `).run(booking);
  res.status(201).json(toPublicBooking(booking));
});

router.patch("/bookings/:id", (req, res) => {
  const { status } = req.body || {};
  const allowed = ["confirmed", "completed", "no-show", "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
  const result = db.prepare(`UPDATE bookings SET status = ? WHERE id = ?`).run(status, req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Booking not found." });
  const row = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(req.params.id);
  res.json(toPublicBooking(row));
});

router.get("/settings", (req, res) => {
  res.json(getSettings());
});

router.put("/settings", (req, res) => {
  const s = req.body || {};
  const current = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  db.prepare(`
    UPDATE settings SET
      business_name = ?, tagline = ?, open_days = ?, open_time = ?, close_time = ?,
      slot_interval_minutes = ?, tables_per_slot = ?, max_party_size = ?, booking_window_days = ?
    WHERE id = 1
  `).run(
    s.businessName ?? current.business_name,
    s.tagline ?? current.tagline,
    JSON.stringify(s.openDays ?? JSON.parse(current.open_days)),
    s.openTime ?? current.open_time,
    s.closeTime ?? current.close_time,
    s.slotIntervalMinutes ?? current.slot_interval_minutes,
    s.tablesPerSlot ?? current.tables_per_slot,
    s.maxPartySize ?? current.max_party_size,
    s.bookingWindowDays ?? current.booking_window_days,
  );
  res.json(getSettings());
});

router.put("/settings/pin", (req, res) => {
  const { newPin } = req.body || {};
  if (!newPin || String(newPin).length < 4) return res.status(400).json({ error: "newPin must be at least 4 characters." });
  db.prepare("UPDATE settings SET admin_pin_hash = ? WHERE id = 1").run(bcrypt.hashSync(String(newPin), 10));
  res.json({ ok: true });
});

export default router;

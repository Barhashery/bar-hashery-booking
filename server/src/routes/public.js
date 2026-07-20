import { Router } from "express";
import { db, uid } from "../db.js";
import { getSettings, availabilityForDate, isOpenDay, genReference, toPublicBooking } from "../booking-logic.js";

const router = Router();

router.get("/settings", (req, res) => {
  res.json(getSettings());
});

router.get("/availability", (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "date is required (YYYY-MM-DD)." });
  const settings = getSettings();
  if (!isOpenDay(date, settings)) return res.json({ open: false, slots: [] });
  res.json({ open: true, slots: availabilityForDate(date, settings) });
});

router.post("/bookings", (req, res) => {
  const { date, time, partySize, name, email, phone, notes } = req.body || {};
  if (!date || !time || !partySize || !name || !email) {
    return res.status(400).json({ error: "date, time, partySize, name, and email are required." });
  }
  const settings = getSettings();
  if (!isOpenDay(date, settings)) return res.status(400).json({ error: "Closed that day." });
  if (partySize < 1 || partySize > settings.maxPartySize) {
    return res.status(400).json({ error: `Party size must be between 1 and ${settings.maxPartySize}.` });
  }

  // Authoritative capacity check happens here on the server, not trusted from the client.
  const taken = db.prepare(
    `SELECT COUNT(*) AS n FROM bookings WHERE date = ? AND time = ? AND status IN ('confirmed','completed')`
  ).get(date, time).n;
  if (taken >= settings.tablesPerSlot) {
    return res.status(409).json({ error: "That time just filled up — pick another slot." });
  }

  const booking = {
    id: uid(), reference: genReference(), date, time, party_size: partySize,
    name: String(name).trim(), email: String(email).trim(), phone: phone || null,
    notes: notes || null, status: "confirmed", created_at: Date.now(),
  };
  db.prepare(`
    INSERT INTO bookings (id, reference, date, time, party_size, name, email, phone, notes, status, created_at)
    VALUES (@id, @reference, @date, @time, @party_size, @name, @email, @phone, @notes, @status, @created_at)
  `).run(booking);

  res.status(201).json(toPublicBooking(booking));
});

router.get("/bookings/lookup", (req, res) => {
  const { reference, email } = req.query;
  if (!reference || !email) return res.status(400).json({ error: "reference and email are required." });
  const row = db.prepare(
    `SELECT * FROM bookings WHERE reference = ? COLLATE NOCASE AND email = ? COLLATE NOCASE`
  ).get(String(reference).trim(), String(email).trim());
  if (!row) return res.status(404).json({ error: "No booking found with that reference and email." });
  res.json(toPublicBooking(row));
});

router.patch("/bookings/:id/cancel", (req, res) => {
  const { reference, email } = req.body || {};
  if (!reference || !email) return res.status(400).json({ error: "reference and email are required." });
  const row = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(req.params.id);
  if (!row || row.reference.toLowerCase() !== String(reference).trim().toLowerCase() || row.email.toLowerCase() !== String(email).trim().toLowerCase()) {
    return res.status(404).json({ error: "No matching booking found." });
  }
  db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(row.id);
  res.json(toPublicBooking({ ...row, status: "cancelled" }));
});

export default router;

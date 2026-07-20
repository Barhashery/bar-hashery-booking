import React, { useState, useEffect, useMemo } from "react";
import {
  Check, X, ChevronRight, ChevronLeft, Search, Settings as SettingsIcon, Plus, Trash2,
  LogOut, Lock, LayoutDashboard, ClipboardList, AlertCircle
} from "lucide-react";
import { api } from "./api.js";

/* ---------- constants ---------- */
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dateStr = (d) => d.toISOString().slice(0, 10);
const todayStr = () => dateStr(new Date());
const fmtDateLong = (ds) => new Date(ds + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
const occupiesSlot = (status) => status === "confirmed" || status === "completed";

const CSS_RULES = `
.bg-hex-000000{background-color:#000000}
.bg-hex-121212{background-color:#121212}
.bg-hex-161616{background-color:#161616}
.bg-hex-242424{background-color:#242424}
.bg-hex-C9A876{background-color:#C9A876}
.border-hex-242424{border-color:#242424}
.border-hex-2E2E2E{border-color:#2E2E2E}
.border-hex-C9A876{border-color:#C9A876}
.focusborder-hex-C9A876:focus{border-color:#C9A876;outline:none}
.hoverbg-hex-161616:hover{background-color:#161616}
.hoverbg-hex-242424:hover{background-color:#242424}
.hoverbg-hex-B4915F:hover{background-color:#B4915F}
.hoverborder-hex-C9A876:hover{border-color:#C9A876}
.hovertext-hex-D98A5E:hover{color:#D98A5E}
.placeholder-hex-5A5650::placeholder{color:#5A5650}
.text-hex-4A4844{color:#4A4844}
.text-hex-9CAE8C{color:#9CAE8C}
.text-hex-C9A876-op80{color:rgba(201,168,118,0.8)}
.text-hex-C9A876{color:#C9A876}
.text-hex-D98A5E{color:#D98A5E}
.text-hex-FFFFFF{color:#FFFFFF}
.divide-hex-242424 > * + *{border-color:#242424}
`;

/* ---------- UI atoms ---------- */
function Button({ children, onClick, variant = "primary", className = "", type = "button", disabled }) {
  const base = "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded text-sm font-medium tracking-wide transition-colors disabled:opacity-35 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-hex-C9A876 text-hex-FFFFFF hoverbg-hex-B4915F",
    outline: "border border-hex-2E2E2E text-hex-FFFFFF hoverbg-hex-242424",
    ghost: "text-hex-FFFFFF",
    dark: "bg-hex-000000 text-hex-FFFFFF border border-hex-2E2E2E hoverborder-hex-C9A876",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
}
function Input(props) { return <input {...props} className={`bg-hex-121212 border border-hex-2E2E2E rounded px-3 py-2.5 text-sm text-hex-FFFFFF placeholder-hex-5A5650 w-full focusborder-hex-C9A876 ${props.className || ""}`} />; }
function Select(props) { return <select {...props} className={`bg-hex-121212 border border-hex-2E2E2E rounded px-3 py-2.5 text-sm text-hex-FFFFFF w-full focusborder-hex-C9A876 ${props.className || ""}`} /> }
function Label({ children }) { return <label className="block text-[11px] uppercase tracking-[0.12em] text-hex-FFFFFF mb-1.5">{children}</label>; }

/* ================================================================== */

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState("book");
  const [settings, setSettings] = useState(null);
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem("bh_admin_token") || null);

  useEffect(() => {
    const prevBg = document.body.style.background;
    const prevMargin = document.body.style.margin;
    document.body.style.background = "#000000";
    document.body.style.margin = "0";
    return () => { document.body.style.background = prevBg; document.body.style.margin = prevMargin; };
  }, []);

  useEffect(() => {
    api.getSettings().then((s) => { setSettings(s); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  function onAdminAuthed(token) {
    sessionStorage.setItem("bh_admin_token", token);
    setAdminToken(token);
    setMode("admin");
  }
  function onAdminExit() {
    sessionStorage.removeItem("bh_admin_token");
    setAdminToken(null);
    setMode("book");
  }

  if (!loaded || !settings) return <div className="min-h-screen flex items-center justify-center bg-hex-000000 text-hex-FFFFFF font-mono text-sm">Loading…</div>;

  return (
    <div className="min-h-screen bg-hex-000000" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui" }}>
      <style>{CSS_RULES}</style>
      {mode !== "admin" && <PublicHeader businessName={settings.businessName} mode={mode} setMode={setMode} />}
      {mode === "book" && <BookingFlow settings={settings} />}
      {mode === "manage" && <ManageBooking />}
      {mode === "admin-login" && <AdminLogin onAuthed={onAdminAuthed} onBack={() => setMode("book")} />}
      {mode === "admin" && adminToken && (
        <AdminArea token={adminToken} initialSettings={settings} onSettingsChanged={setSettings} onExit={onAdminExit} />
      )}
    </div>
  );
}

/* ---------------- Public header ---------------- */

function PublicHeader({ businessName, mode, setMode }) {
  return (
    <header className="border-b border-hex-242424">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <button onClick={() => setMode("book")} style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-lg text-hex-FFFFFF tracking-tight">{businessName}</button>
        <nav className="flex items-center gap-1 text-sm">
          <button onClick={() => setMode("book")} className={`px-3 py-1.5 rounded ${mode === "book" ? "bg-hex-C9A876 text-hex-FFFFFF" : "text-hex-FFFFFF"}`}>Book a table</button>
          <button onClick={() => setMode("manage")} className={`px-3 py-1.5 rounded ${mode === "manage" ? "bg-hex-C9A876 text-hex-FFFFFF" : "text-hex-FFFFFF"}`}>Manage booking</button>
          <button onClick={() => setMode("admin-login")} className="px-3 py-1.5 rounded text-hex-FFFFFF text-xs ml-2 opacity-60">Staff</button>
        </nav>
      </div>
    </header>
  );
}

/* ---------------- Booking flow (public) ---------------- */

function BookingFlow({ settings }) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [time, setTime] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [confirmed, setConfirmed] = useState(null);
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState({ open: true, slots: [] });
  const [loadingSlots, setLoadingSlots] = useState(false);

  const minDate = todayStr();
  const maxDate = dateStr(new Date(Date.now() + settings.bookingWindowDays * 86400000));
  const isOpenDay = (ds) => ds && settings.openDays.includes(new Date(ds + "T00:00:00").getDay());

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    api.getAvailability(date).then(setAvailability).finally(() => setLoadingSlots(false));
  }, [date]);

  const remainingAt = (t) => availability.slots.find((s) => s.time === t)?.remaining ?? 0;

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required."); return; }
    try {
      const booking = await api.createBooking({ date, time, partySize, ...form });
      setConfirmed(booking);
    } catch (e) {
      setError(e.message);
      const fresh = await api.getAvailability(date);
      setAvailability(fresh);
      setStep(2); setTime(null);
    }
  }

  if (confirmed) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <TicketStub booking={confirmed} businessName={settings.businessName} />
        <p className="text-center text-sm text-hex-FFFFFF mt-6 opacity-70">
          A confirmation would normally be emailed to {confirmed.email}. Keep your reference — you'll need it to change or cancel.
        </p>
        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => { setConfirmed(null); setStep(1); setDate(""); setTime(null); setForm({ name: "", email: "", phone: "", notes: "" }); }}>Make another booking</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      {step === 1 && (
        <div>
          <div className="flex justify-center mb-8">
            <img src="/logo.jpg" alt={settings.businessName} className="w-full max-w-[280px] rounded" />
          </div>
          <Eyebrow n={1} label="Party & date" />
          <h1 style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-3xl text-hex-FFFFFF mb-2">How many, and when?</h1>
          <p className="text-hex-FFFFFF opacity-70 text-sm mb-8">{settings.tagline}</p>
          <div className="space-y-5">
            <div>
              <Label>Party size</Label>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: settings.maxPartySize }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPartySize(n)} className={`w-10 h-10 rounded border text-sm font-mono ${partySize === n ? "bg-hex-C9A876 border-hex-C9A876 text-hex-FFFFFF" : "border-hex-2E2E2E text-hex-FFFFFF hoverborder-hex-C9A876"}`}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" min={minDate} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} />
              {date && !isOpenDay(date) && (
                <p className="text-xs text-hex-D98A5E mt-2 flex items-center gap-1.5"><AlertCircle size={13} /> Closed {DAY_NAMES[new Date(date + "T00:00:00").getDay()]}s — try another date.</p>
              )}
            </div>
          </div>
          <Button className="w-full mt-8" disabled={!date || !isOpenDay(date)} onClick={() => setStep(2)}>Find a table <ChevronRight size={15} /></Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <Eyebrow n={2} label="Time" />
          <button onClick={() => setStep(1)} className="text-xs text-hex-FFFFFF opacity-70 flex items-center gap-1 mb-4"><ChevronLeft size={13} /> Change party/date</button>
          <h1 style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-3xl text-hex-FFFFFF mb-1">{fmtDateLong(date)}</h1>
          <p className="text-hex-FFFFFF opacity-70 text-sm mb-8">Table for {partySize} · pick a time</p>
          {loadingSlots ? (
            <p className="text-sm text-hex-FFFFFF opacity-50">Checking availability…</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availability.slots.map(({ time: t, remaining }) => {
                const full = remaining <= 0;
                return (
                  <button key={t} disabled={full} onClick={() => { setTime(t); setStep(3); }}
                    className={`py-2.5 rounded border text-sm font-mono transition-colors ${full ? "border-hex-242424 text-hex-4A4844 cursor-not-allowed line-through" : "border-hex-2E2E2E text-hex-FFFFFF hoverborder-hex-C9A876 hoverbg-hex-242424"}`}>
                    {t}
                  </button>
                );
              })}
            </div>
          )}
          {!loadingSlots && !availability.slots.some((s) => s.remaining > 0) && <p className="text-sm text-hex-D98A5E mt-4">Fully booked this day — try another date.</p>}
        </div>
      )}

      {step === 3 && (
        <div>
          <Eyebrow n={3} label="Your details" />
          <button onClick={() => setStep(2)} className="text-xs text-hex-FFFFFF opacity-70 flex items-center gap-1 mb-4"><ChevronLeft size={13} /> Change time</button>
          <h1 style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-3xl text-hex-FFFFFF mb-1">Almost there</h1>
          <p className="text-hex-FFFFFF opacity-70 text-sm mb-8 font-mono">{fmtDateLong(date)} · {time} · table for {partySize}</p>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" /></div>
            <div><Label>Phone (optional)</Label><Input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="For last-minute changes" /></div>
            <div><Label>Notes (optional)</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Allergies, occasion, anything we should know" /></div>
          </div>
          {error && <p className="text-sm text-hex-D98A5E mt-4">{error}</p>}
          <Button className="w-full mt-6" onClick={submit}>Confirm booking</Button>
        </div>
      )}
    </div>
  );
}

function Eyebrow({ n, label }) {
  return <div className="text-[11px] uppercase tracking-[0.16em] text-hex-C9A876 font-mono mb-3">Step {n} of 3 · {label}</div>;
}

function TicketStub({ booking, businessName }) {
  return (
    <div className="bg-hex-121212 border border-hex-2E2E2E rounded-lg overflow-hidden">
      <div className="p-6 text-center">
        <Check size={28} className="text-hex-C9A876 mx-auto mb-3" />
        <div style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-2xl text-hex-FFFFFF mb-1">You're booked</div>
        {businessName && <div className="text-sm text-hex-FFFFFF opacity-70">{businessName}</div>}
      </div>
      <div className="border-t border-dashed border-hex-2E2E2E relative">
        <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-hex-000000" />
        <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-hex-000000" />
      </div>
      <div className="p-6 grid grid-cols-2 gap-4 text-sm">
        <div><div className="text-[11px] uppercase tracking-wider text-hex-FFFFFF opacity-50">Date</div><div className="text-hex-FFFFFF font-mono mt-0.5">{booking.date}</div></div>
        <div><div className="text-[11px] uppercase tracking-wider text-hex-FFFFFF opacity-50">Time</div><div className="text-hex-FFFFFF font-mono mt-0.5">{booking.time}</div></div>
        <div><div className="text-[11px] uppercase tracking-wider text-hex-FFFFFF opacity-50">Party</div><div className="text-hex-FFFFFF font-mono mt-0.5">{booking.partySize}</div></div>
        <div><div className="text-[11px] uppercase tracking-wider text-hex-FFFFFF opacity-50">Name</div><div className="text-hex-FFFFFF mt-0.5">{booking.name}</div></div>
      </div>
      <div className="bg-hex-000000 px-6 py-4 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-hex-FFFFFF opacity-50">Reference</span>
        <span className="font-mono text-lg tracking-[0.2em] text-hex-C9A876">{booking.reference}</span>
      </div>
    </div>
  );
}

/* ---------------- Manage / cancel booking (public) ---------------- */

function ManageBooking() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState(null);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);

  async function lookup() {
    try {
      const booking = await api.lookupBooking(reference.trim(), email.trim());
      setError(""); setFound(booking); setCancelled(booking.status === "cancelled");
    } catch (e) {
      setError(e.message); setFound(null);
    }
  }
  async function cancelBooking() {
    const updated = await api.cancelBooking(found.id, reference.trim(), email.trim());
    setFound(updated); setCancelled(true);
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-3xl text-hex-FFFFFF mb-1">Manage your booking</div>
      <p className="text-hex-FFFFFF opacity-70 text-sm mb-8">Look it up with your reference and the email you booked with.</p>
      {!found ? (
        <div className="space-y-4">
          <div><Label>Booking reference</Label><Input value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} placeholder="e.g. 7K2QXM" className="font-mono tracking-widest" /></div>
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          {error && <p className="text-sm text-hex-D98A5E">{error}</p>}
          <Button className="w-full" onClick={lookup}><Search size={15} /> Find booking</Button>
        </div>
      ) : (
        <div>
          <TicketStub booking={found} businessName="" />
          {cancelled ? (
            <p className="text-center text-sm text-hex-D98A5E mt-6">This booking has been cancelled.</p>
          ) : (
            <Button variant="outline" className="w-full mt-6" onClick={cancelBooking}><X size={15} /> Cancel this booking</Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Admin login ---------------- */

function AdminLogin({ onAuthed, onBack }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try {
      const { token } = await api.adminLogin(pin);
      onAuthed(token);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <Lock size={20} className="text-hex-C9A876 mb-4" />
      <div style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-2xl text-hex-FFFFFF mb-1">Staff access</div>
      <p className="text-hex-FFFFFF opacity-70 text-sm mb-6">Enter the admin PIN to manage bookings.</p>
      <Input type="password" value={pin} onChange={(e) => { setPin(e.target.value); setError(""); }} placeholder="PIN" className="font-mono tracking-widest mb-3" onKeyDown={(e) => e.key === "Enter" && submit()} />
      {error && <p className="text-sm text-hex-D98A5E mb-3">{error}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={submit} disabled={busy} className="flex-1">{busy ? "Checking…" : "Enter"}</Button>
      </div>
    </div>
  );
}

/* ---------------- Admin area ---------------- */

function AdminArea({ token, initialSettings, onSettingsChanged, onExit }) {
  const [tab, setTab] = useState("dashboard");
  const [settings, setSettings] = useState(initialSettings);
  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "bookings", label: "Bookings", icon: ClipboardList },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];
  function handleSettingsSaved(updated) {
    setSettings(updated);
    onSettingsChanged(updated);
  }
  return (
    <div className="min-h-screen bg-hex-000000 flex" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui" }}>
      <aside className="w-56 shrink-0 bg-hex-000000 border-r border-hex-242424 flex flex-col">
        <div className="px-5 py-5 border-b border-hex-242424">
          <div className="text-[11px] uppercase tracking-[0.2em] text-hex-C9A876-op80 font-mono">Staff</div>
          <div style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-lg text-hex-FFFFFF mt-0.5">{settings.businessName}</div>
        </div>
        <nav className="flex-1 py-3">
          {TABS.map((t) => {
            const Icon = t.icon; const active = tab === t.id;
            return <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm ${active ? "bg-hex-242424 text-hex-FFFFFF border-r-2 border-hex-C9A876" : "text-hex-FFFFFF opacity-70 hoverbg-hex-161616"}`}><Icon size={16} /> {t.label}</button>;
          })}
        </nav>
        <button onClick={onExit} className="flex items-center gap-2.5 px-5 py-3 text-sm text-hex-FFFFFF opacity-70 border-t border-hex-242424"><LogOut size={16} /> Exit staff area</button>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto max-h-screen">
        {tab === "dashboard" && <AdminDashboard token={token} settings={settings} />}
        {tab === "bookings" && <AdminBookings token={token} settings={settings} />}
        {tab === "settings" && <AdminSettings token={token} settings={settings} onSaved={handleSettingsSaved} />}
      </main>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-hex-121212 border border-hex-242424 rounded-lg p-4 flex-1 min-w-[150px]">
      <div className="text-[11px] uppercase tracking-wider text-hex-FFFFFF opacity-50 font-mono">{label}</div>
      <div className="text-2xl text-hex-FFFFFF mt-1 font-mono">{value}</div>
      {sub && <div className="text-xs text-hex-FFFFFF opacity-50 mt-1">{sub}</div>}
    </div>
  );
}

function AdminDashboard({ token, settings }) {
  const [todays, setTodays] = useState([]);
  const [next7Count, setNext7Count] = useState(0);
  const today = todayStr();

  useEffect(() => {
    api.adminGetBookings(token, { date: today }).then((rows) => setTodays(rows.filter((r) => occupiesSlot(r.status)).sort((a, b) => a.time.localeCompare(b.time))));
    const from = dateStr(new Date(Date.now() + 86400000));
    const to = dateStr(new Date(Date.now() + 7 * 86400000));
    api.adminGetBookings(token, { from, to }).then((rows) => setNext7Count(rows.filter((r) => occupiesSlot(r.status)).length));
  }, [token, today]);

  const coversToday = todays.reduce((s, b) => s + b.partySize, 0);
  const cancelledToday = todays.filter((b) => b.status === "cancelled").length;

  return (
    <div>
      <h1 style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-2xl text-hex-FFFFFF mb-1">Dashboard</h1>
      <p className="text-sm text-hex-FFFFFF opacity-50 mb-5">{fmtDateLong(today)}</p>
      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard label="Bookings today" value={todays.length} />
        <StatCard label="Covers today" value={coversToday} />
        <StatCard label="Bookings next 7 days" value={next7Count} />
        <StatCard label="Cancelled today" value={cancelledToday} />
      </div>
      <div className="bg-hex-121212 border border-hex-242424 rounded-lg overflow-hidden">
        <div className="border-b border-hex-242424 px-4 py-2.5 text-xs uppercase tracking-wider text-hex-FFFFFF opacity-50 font-mono">Today's bookings</div>
        {!todays.length ? (
          <div className="p-8 text-center text-hex-4A4844 text-sm">Nothing booked today.</div>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-hex-242424">
              {todays.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2.5 font-mono text-hex-C9A876">{b.time}</td>
                  <td className="px-4 py-2.5 text-hex-FFFFFF">{b.name}</td>
                  <td className="px-4 py-2.5 font-mono text-hex-FFFFFF opacity-70">party of {b.partySize}</td>
                  <td className="px-4 py-2.5 text-hex-FFFFFF opacity-50">{b.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AdminBookings({ token, settings }) {
  const [filterDate, setFilterDate] = useState(todayStr());
  const [list, setList] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  function reload() {
    api.adminGetBookings(token, { date: filterDate }).then((rows) => setList(rows.sort((a, b) => a.time.localeCompare(b.time))));
  }
  useEffect(reload, [token, filterDate]);

  async function updateStatus(id, status) {
    await api.adminUpdateBookingStatus(token, id, status);
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h1 style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-2xl text-hex-FFFFFF">Bookings</h1>
        <div className="flex items-center gap-2">
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-40" />
          <Button onClick={() => setShowAdd(true)}><Plus size={15} /> Add booking</Button>
        </div>
      </div>
      <p className="text-sm text-hex-FFFFFF opacity-50 mb-5">{fmtDateLong(filterDate)} · {list.filter((b) => occupiesSlot(b.status)).length} active</p>
      <div className="bg-hex-121212 border border-hex-242424 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-hex-161616 text-hex-FFFFFF opacity-70 text-xs uppercase tracking-wider font-mono"><th className="text-left px-4 py-2.5">Time</th><th className="text-left px-4 py-2.5">Name</th><th className="text-left px-4 py-2.5">Party</th><th className="text-left px-4 py-2.5">Contact</th><th className="text-left px-4 py-2.5">Notes</th><th className="text-left px-4 py-2.5">Status</th></tr></thead>
          <tbody className="divide-hex-242424">
            {list.map((b) => (
              <tr key={b.id} className={b.status === "cancelled" ? "opacity-40" : ""}>
                <td className="px-4 py-2.5 font-mono text-hex-C9A876">{b.time}</td>
                <td className="px-4 py-2.5 text-hex-FFFFFF">{b.name}</td>
                <td className="px-4 py-2.5 font-mono text-hex-FFFFFF opacity-70">{b.partySize}</td>
                <td className="px-4 py-2.5 text-hex-FFFFFF opacity-50 text-xs">{b.email}{b.phone ? ` · ${b.phone}` : ""}</td>
                <td className="px-4 py-2.5 text-hex-FFFFFF opacity-50 text-xs">{b.notes}</td>
                <td className="px-4 py-2.5">
                  <Select value={b.status} onChange={(e) => updateStatus(b.id, e.target.value)} className="text-xs py-1">
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="no-show">No-show</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-hex-4A4844">No bookings this day.</td></tr>}
          </tbody>
        </table>
      </div>
      {showAdd && <AddBookingModal token={token} date={filterDate} settings={settings} onCreated={() => { setShowAdd(false); reload(); }} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddBookingModal({ token, date, settings, onCreated, onClose }) {
  const [availability, setAvailability] = useState({ slots: [] });
  const [time, setTime] = useState(settings.openTime);
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { api.getAvailability(date).then((a) => { setAvailability(a); if (a.slots[0]) setTime(a.slots[0].time); }); }, [date]);
  const remaining = availability.slots.find((s) => s.time === time)?.remaining ?? 0;

  async function submit() {
    if (!name.trim()) return;
    await api.adminCreateBooking(token, { date, time, partySize, name: name.trim(), email, phone, notes });
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-hex-121212 border border-hex-242424 rounded-lg p-5 w-96" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-lg text-hex-FFFFFF">Add booking · {date}</div>
          <button onClick={onClose} className="text-hex-FFFFFF opacity-50"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div><Label>Time</Label><Select value={time} onChange={(e) => setTime(e.target.value)}>{availability.slots.map((s) => <option key={s.time} value={s.time}>{s.time}{s.remaining <= 0 ? " (full)" : ""}</option>)}</Select></div>
          {remaining <= 0 && <p className="text-xs text-hex-D98A5E">This slot is already at capacity — adding anyway will overbook it.</p>}
          <div><Label>Party size</Label><Input type="number" min="1" value={partySize} onChange={(e) => setPartySize(parseInt(e.target.value) || 1)} /></div>
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name" /></div>
          <div><Label>Email (optional)</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Phone (optional)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. phone booking, birthday" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim()}><Check size={14} /> Add</Button>
        </div>
      </div>
    </div>
  );
}

function AdminSettings({ token, settings, onSaved }) {
  const [local, setLocal] = useState(settings);
  const [newPin, setNewPin] = useState("");
  const [saved, setSaved] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);

  function toggleDay(d) {
    setLocal((v) => ({ ...v, openDays: v.openDays.includes(d) ? v.openDays.filter((x) => x !== d) : [...v.openDays, d].sort() }));
  }
  async function save() {
    const updated = await api.adminUpdateSettings(token, local);
    onSaved(updated);
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }
  async function savePin() {
    if (!newPin) return;
    await api.adminUpdatePin(token, newPin);
    setNewPin(""); setPinSaved(true); setTimeout(() => setPinSaved(false), 1500);
  }

  return (
    <div className="max-w-lg">
      <h1 style={{ fontFamily: "'Fraunces', ui-serif, serif" }} className="text-2xl text-hex-FFFFFF mb-5">Settings</h1>
      <div className="space-y-4">
        <div><Label>Business name</Label><Input value={local.businessName} onChange={(e) => setLocal((v) => ({ ...v, businessName: e.target.value }))} /></div>
        <div><Label>Tagline (shown on booking page)</Label><Input value={local.tagline} onChange={(e) => setLocal((v) => ({ ...v, tagline: e.target.value }))} /></div>
        <div>
          <Label>Open days</Label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_SHORT.map((name, idx) => (
              <button key={idx} onClick={() => toggleDay(idx)} className={`text-xs px-2.5 py-1.5 rounded border ${local.openDays.includes(idx) ? "bg-hex-C9A876 border-hex-C9A876 text-hex-FFFFFF" : "border-hex-2E2E2E text-hex-FFFFFF opacity-70"}`}>{name}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Opening time</Label><Input type="time" value={local.openTime} onChange={(e) => setLocal((v) => ({ ...v, openTime: e.target.value }))} /></div>
          <div><Label>Last seating</Label><Input type="time" value={local.closeTime} onChange={(e) => setLocal((v) => ({ ...v, closeTime: e.target.value }))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Slot interval (minutes)</Label><Input type="number" value={local.slotIntervalMinutes} onChange={(e) => setLocal((v) => ({ ...v, slotIntervalMinutes: parseInt(e.target.value) || 15 }))} /></div>
          <div><Label>Tables per slot</Label><Input type="number" value={local.tablesPerSlot} onChange={(e) => setLocal((v) => ({ ...v, tablesPerSlot: parseInt(e.target.value) || 1 }))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Max party size</Label><Input type="number" value={local.maxPartySize} onChange={(e) => setLocal((v) => ({ ...v, maxPartySize: parseInt(e.target.value) || 1 }))} /></div>
          <div><Label>Booking window (days ahead)</Label><Input type="number" value={local.bookingWindowDays} onChange={(e) => setLocal((v) => ({ ...v, bookingWindowDays: parseInt(e.target.value) || 1 }))} /></div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-6">
        <Button onClick={save}><Check size={14} /> Save changes</Button>
        {saved && <span className="text-sm text-hex-9CAE8C">Saved.</span>}
      </div>

      <div className="mt-8 pt-6 border-t border-hex-242424">
        <Label>Change staff PIN</Label>
        <div className="flex items-center gap-2">
          <Input value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="New PIN" className="font-mono tracking-widest max-w-[140px]" />
          <Button variant="outline" onClick={savePin} disabled={!newPin}>Update PIN</Button>
          {pinSaved && <span className="text-sm text-hex-9CAE8C">Updated.</span>}
        </div>
      </div>
    </div>
  );
}

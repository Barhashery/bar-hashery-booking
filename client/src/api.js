// Same-origin by default (server serves this built app). Override via VITE_API_BASE
// if the frontend is ever hosted separately from the API.
const BASE = import.meta.env.VITE_API_BASE || "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  getSettings: () => request("/settings"),
  getAvailability: (date) => request(`/availability?date=${encodeURIComponent(date)}`),
  createBooking: (data) => request("/bookings", { method: "POST", body: JSON.stringify(data) }),
  lookupBooking: (reference, email) =>
    request(`/bookings/lookup?reference=${encodeURIComponent(reference)}&email=${encodeURIComponent(email)}`),
  cancelBooking: (id, reference, email) =>
    request(`/bookings/${id}/cancel`, { method: "PATCH", body: JSON.stringify({ reference, email }) }),

  adminLogin: (pin) => request("/admin/login", { method: "POST", body: JSON.stringify({ pin }) }),
  adminGetBookings: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/bookings${qs ? `?${qs}` : ""}`, { headers: { Authorization: `Bearer ${token}` } });
  },
  adminCreateBooking: (token, data) =>
    request("/admin/bookings", { method: "POST", body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } }),
  adminUpdateBookingStatus: (token, id, status) =>
    request(`/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }), headers: { Authorization: `Bearer ${token}` } }),
  adminGetSettings: (token) => request("/admin/settings", { headers: { Authorization: `Bearer ${token}` } }),
  adminUpdateSettings: (token, settings) =>
    request("/admin/settings", { method: "PUT", body: JSON.stringify(settings), headers: { Authorization: `Bearer ${token}` } }),
  adminUpdatePin: (token, newPin) =>
    request("/admin/settings/pin", { method: "PUT", body: JSON.stringify({ newPin }), headers: { Authorization: `Bearer ${token}` } }),
};

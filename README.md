# Bar Hashery — Table Booking System

A real, multi-user booking system: a Node/Express API backed by SQLite, and a
React booking page that talks to it. Every visitor and staff member sees the
same live availability and bookings — this is the version meant to actually
go live on your website, not the Claude-only demo.

## How it's structured

```
server/   Express API + SQLite database (the source of truth)
client/   React booking page (public booking flow + staff admin area)
```

In production, the server serves the built client too, so you deploy **one
service** and it does everything — API and website together, at one URL.

## Running it locally

You'll need [Node.js](https://nodejs.org) (18+) installed.

**1. Start the server:**
```bash
cd server
cp .env.example .env
# open .env and set JWT_SECRET to a long random string
npm install
npm run dev
```
The API runs at http://localhost:4000.

**2. Start the client (separate terminal):**
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173 — the booking page, talking to your local API.

**Demo staff PIN:** `1234` — change it immediately under Settings once you're
using this for real (Admin → Settings → Change staff PIN).

## Deploying it for real

You need a host that runs actual Node.js server code — Hostinger's website
builder can't do this itself, so this app needs to live somewhere else, then
get embedded into your Hostinger page (see below).

Recommended: **[Railway](https://railway.app)** or **[Render](https://render.com)**
— both have simple free/cheap tiers that run a Node app continuously with a
persistent disk (needed so your SQLite database file doesn't get wiped on
restart).

### Steps (Railway, similar on Render):

1. Push this project to a GitHub repo (or use Railway's CLI to deploy a local
   folder directly).
2. Create a new Railway project from that repo, pointing it at the `server/`
   folder as the root.
3. Before deploying, you need the client built and copied into the server:
   ```bash
   cd client
   npm install
   npm run build
   cp -r dist ../server/../client-build   # see note below
   ```
   Simplest in practice: add a build step in your host's settings that runs:
   ```bash
   cd client && npm install && npm run build && cd ../server && npm install
   ```
   and a start command of:
   ```bash
   node src/index.js
   ```
   Make sure `client/dist` ends up at the path `server/src/index.js` expects
   (`../../client/dist` relative to `server/src`) — if your host builds both
   folders from the repo root, this works automatically with no copying.
4. Set environment variables on the host: `JWT_SECRET` (a long random
   string), and `ALLOWED_ORIGIN` (your Hostinger site's URL, once you know
   it — e.g. `https://barhashery.com`).
5. Add a **persistent volume** mounted at the `server/` folder (or wherever
   `data.sqlite` will be created) — without this, your bookings will vanish
   on every redeploy. Railway calls this a "Volume"; Render calls it a
   "Disk."
6. Deploy. You'll get a URL like `https://bar-hashery-booking.up.railway.app`
   — that's your live booking site.

## Embedding it into your Hostinger site

Since your site uses the Hostinger website builder, you can't run this app
*inside* Hostinger — but you can embed the live page you just deployed:

1. In the Hostinger website builder, add an **"Embed" / "HTML" element** to
   the page where you want the booking form (usually under "Advanced" or
   "Embed code" in the element list).
2. Paste this, swapping in your real deployed URL:
   ```html
   <iframe
     src="https://your-deployed-url.up.railway.app"
     style="width:100%; height:900px; border:none;"
     title="Bar Hashery booking"
   ></iframe>
   ```
3. Publish. The booking page now appears embedded directly in your site,
   fully working, sharing one live database for every visitor and for staff.

A plain link also works if you'd rather send people to the booking page
directly (e.g. a "Book a table" button linking straight to your deployed
URL) instead of embedding it in an iframe — either is fine.

## Security notes

- The staff PIN is hashed (bcrypt) in the database, not stored in plain
  text, and admin actions require a signed session token — this is real
  authentication, unlike the Claude-only demo version.
- Still worth doing before going fully live: enable HTTPS on your deployed
  URL (Railway/Render do this automatically), and change the demo PIN
  immediately.
- The server does its own capacity check when a booking is created — it
  never trusts the client's view of availability, so double-booking from a
  stale screen isn't possible.

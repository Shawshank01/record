---
title: "Self‑Hosted Lightweight Analytics for This Blog (Step‑by‑Step)"
description: "How I added privacy‑friendly visitor statistics to a static Astro site using a tiny Node.js endpoint, SQLite, PM2, and Caddy."
pubDate: 2025-11-01
tags:
  - IT
  - Linux
---

> Instead of using third‑party analytics like Cloudflare, I’m running a tiny **self‑hosted** tracker so you can also learn how it works and replicate it.

## What I've built

A tiny analytics API that:
- Accepts page‑view pings from this blog (`/track`)
- Summarises counts per path (`/stats`)
- Lets me export raw visits as CSV (`/export`)
- Stores data in a single `SQLite` file for easy backup/migration
- Runs forever with `pm2`, served over HTTPS with `Caddy`

You can adapt this for any static site (Astro, Hugo, etc.).

---

## 0) Prerequisites

- Ubuntu VM with a public IP
- Shell access with `sudo`
- A subdomain for the analytics endpoint (I use `stats.zaku.eu.org`)
- Basic DNS access (Cloudflare in my case)
- Node.js 18+ and npm

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git
```

---

## 1) Create the analytics service

Create a new folder and initialise a Node project:

```bash
mkdir ~/page-stats && cd ~/page-stats
npm init -y
npm install express sqlite3 cors
```

Create `server.js`:

```js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const app = express();
const db = new sqlite3.Database("stats.db");

const EXPORT_PASSWORD = "secretkey";

app.use(express.json());
// Accept plain text or JSON from browsers (needed for no-cors fetch)
app.use(express.text({ type: "*/*" }));

db.run(`CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT,
  referrer TEXT,
  ua TEXT,
  ip TEXT,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.post("/track", (req, res) => {
  let body = req.body;

  // Handle both text/plain and JSON input
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { path, referrer, ua } = body || {};
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

  if (!path) {
    console.warn("[analytics] Missing path field in request body");
    return res.sendStatus(400);
  }

  db.run(
    `INSERT INTO visits (path, referrer, ua, ip) VALUES (?, ?, ?, ?)`,
    [path, referrer || "", ua || "", ip],
    (err) => {
      if (err) {
        console.error("DB insert error:", err);
        return res.sendStatus(500);
      }
      res.sendStatus(204);
    }
  );
});

// Basic visualisation endpoint (JSON)
app.get("/stats", (req, res) => {
  db.all(`SELECT path, COUNT(*) as views FROM visits GROUP BY path ORDER BY views DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// CSV export
app.get("/export", (req, res) => {
  const token = req.query.token;
  if (token !== EXPORT_PASSWORD) {
    return res.status(403).send("Forbidden: Invalid export token");
  }

  db.all(`SELECT * FROM visits ORDER BY ts DESC`, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    const csv = [
      "id,path,referrer,ua,ip,ts",
      ...rows.map(r => `${r.id},"${r.path}","${r.referrer}","${r.ua}","${r.ip}","${r.ts}"`)
    ].join("\n");
    res.setHeader("Content-Disposition", "attachment; filename=stats.csv");
    res.type("text/csv").send(csv);
  });
});

// --- Daily summary (views per day) ---
app.get("/daily", (req, res) => {
  db.all(
    `SELECT DATE(ts) AS day, COUNT(*) AS views
     FROM visits
     GROUP BY day
     ORDER BY day DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// --- Totals summary (overall + by path + by day) ---
app.get("/summary", (req, res) => {
  const result = {};

  db.get(`SELECT COUNT(*) AS total_visits FROM visits`, (err, totalRow) => {
    if (err) return res.status(500).json({ error: err.message });
    result.total_visits = totalRow.total_visits;

    db.all(
      `SELECT path, COUNT(*) AS views
       FROM visits
       GROUP BY path
       ORDER BY views DESC`,
      (err, pathRows) => {
        if (err) return res.status(500).json({ error: err.message });
        result.by_path = pathRows;

        db.all(
          `SELECT DATE(ts) AS day, COUNT(*) AS views
           FROM visits
           GROUP BY day
           ORDER BY day DESC`,
          (err, dayRows) => {
            if (err) return res.status(500).json({ error: err.message });
            result.by_day = dayRows;
            res.json(result);
          }
        );
      }
    );
  });
});

app.listen(8080, () => console.log("Analytics server running on port 8080"));
```


Quick test:

```bash
node server.js
# In another shell:
curl -X POST http://localhost:8080/track \
  -H "Content-Type: application/json" \
  -d '{"path":"/hello","referrer":"","ua":"curl"}'
curl http://localhost:8080/stats
```

You should see a JSON array with counts.

---

## 2) Keep it running with pm2

```bash
sudo npm install -g pm2
pm2 start server.js --name stats
pm2 save
pm2 startup
# Follow the one-line command pm2 prints for systemd
```

Check status:

```bash
pm2 ls
```

---

## 3) Obtain HTTPS with Caddy (reverse proxy)

Install Caddy (on Ubuntu). Then configure `/etc/caddy/Caddyfile`:

```caddy
stats.zaku.eu.org {

    reverse_proxy localhost:8080

    root * /usr/share/caddy
    file_server

    header {
        Access-Control-Allow-Origin "https://x.zaku.eu.org"
        Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Access-Control-Allow-Headers "Content-Type"
        Access-Control-Allow-Credentials true
        Access-Control-Max-Age "86400"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "no-referrer-when-downgrade"
    }

    @options method OPTIONS
    respond @options 204

    log {
        output file /var/log/caddy/stats-access.log {
            roll_size 10MB
            roll_keep 10
            roll_keep_for 720h
        }
    }
}
```
Remember to change the domain name to yours.  
Reload and tail logs:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo journalctl -u caddy -f
```

---

## 4) DNS (Cloudflare)

Add an **A** record:

- Name: `stats`
- Target: your VM public IP
- Proxy status: **DNS only** (gray cloud)

Caddy will fetch a Let’s Encrypt certificate automatically.  
After issuance, HTTPS works at `https://stats.zaku.eu.org`.

---

## 5) Add the tracking snippet to the blog (Astro)

Place this near the bottom of your frontend code, such as `BaseLayout.astro` (before `</body>`):

```html
<script is:inline>
  (() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const endpoint = 'https://stats.zaku.eu.org/track'; // You need to replace it with you own domain!
    const payload = JSON.stringify({
      path: window.location.pathname,
      referrer: document.referrer || '',
      ua: navigator.userAgent
    });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        const ok = navigator.sendBeacon(endpoint, blob);
        if (ok) return;
      }
      fetch(endpoint, {
        method: 'POST',
        body: payload,
        keepalive: true,
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.warn('[analytics] fetch failed', err));
    } catch (err) {
      console.warn('[analytics] unexpected error', err);
    }
  })();
</script>
```

This avoids mixed content and should be works across modern browsers without AdBlocker extensions.

---

## 6) Verify end‑to‑end

From the browser:
- Visit the blog.
- Check JSON summary:

```bash
curl https://stats.zaku.eu.org/stats
```

Manual POST test over HTTPS:

```bash
curl -X POST https://stats.zaku.eu.org/track \
  -H "Content-Type: application/json" \
  -d '{"path":"/test","referrer":"","ua":"curl"}'
```

CSV export:

```bash
curl -L -o stats.csv "https://stats.zaku.eu.org/export?token=secretkey"
```

---

## 6.1) Visualise daily and total stats with `/daily` and `/summary` endpoints

The analytics API includes two useful endpoints for viewing detailed statistics:

- **`/daily`**: Returns daily visit counts per path for the last 30 days. Useful for tracking trends over time.
- **`/summary`**: Returns total counts (all-time) and unique paths, suitable for quick dashboard overviews.

These endpoints make it easy to visualise daily activity or build a simple dashboard.

### `/daily` endpoint

Returns a JSON array with daily stats for each path:

```json
[
  {
    "date": "2025-10-30",
    "path": "/",
    "views": 12
  },
  {
    "date": "2025-10-30",
    "path": "/about",
    "views": 3
  },
  {
    "date": "2025-10-31",
    "path": "/",
    "views": 15
  }
]
```

Query it with:

```bash
curl https://stats.zaku.eu.org/daily
```

### `/summary` endpoint

Returns top-level summary stats:

```json
{
  "total_views": 1234,
  "unique_paths": 8,
  "first_visit": "2025-10-01T09:00:00Z",
  "last_visit": "2025-10-31T11:45:12Z"
}
```

Query it with:

```bash
curl https://stats.zaku.eu.org/summary
```

You can use these endpoints to build graphs, daily charts, or even a mini dashboard.

> **Tip:** For a more visual experience, you can optionally build a simple dashboard page (using e.g. Svelte, React, or plain HTML) that fetches from `/daily` and `/summary` to display your stats.

## 7) Backup &amp; migrate (one‑file move)

All analytics live in `stats.db`. To migrate to a new VM:

```bash
# On old VM
sudo systemctl stop caddy
pm2 stop stats
scp ~/page-stats/stats.db ubuntu@NEW_VM:/home/ubuntu/page-stats/
# On new VM, start pm2 and caddy again
```

You can also snapshot/export CSV periodically.

---

## 8) Privacy notes

- No third‑party beacons, no cookies, no cross‑site tracking.
- IP is stored for basic uniqueness/debug, feel free to anonymise or drop it.
- Respect DNT if you wish (read `navigator.doNotTrack === "1"` and skip).

Example anonymisation tweak:

```js
function anonymizeIp(raw) {
  const m = String(raw || "").match(/(\d+\.\d+\.\d+)\.\d+/);
  return m ? m[1] + ".0" : raw;
}
```

---

## 9) Troubleshooting

- **“Cannot GET /”** when visiting the VM IP: normal — define `/` or go to `/stats`.
- **Mixed content blocked**: ensure the endpoint is **HTTPS** and CORS allows your blog origin.
- **DNS check fails**: gray‑cloud the `stats` record until the certificate is issued.
- **No data appears**: test with a direct `curl -X POST .../track` and check `pm2 logs`.

### Test your endpoint manually

You can manually test your tracking endpoint with:

```bash
curl -X POST http://localhost:8080/track \
  -H "Content-Type: application/json" \
  -d '{"path":"/hello","referrer":"","ua":"curl"}'
curl http://localhost:8080/stats
```

A new entry appearing in `/stats` confirms your endpoint is working correctly.

---

That’s it. This blog now uses a **self‑hosted, portable, privacy‑friendly analytics** system. If you build your own, feel free to fork these snippets and adapt the endpoints to your domain.

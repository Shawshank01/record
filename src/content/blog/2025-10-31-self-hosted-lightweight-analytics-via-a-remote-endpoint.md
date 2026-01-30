---
title: "Self‑Hosted Lightweight Analytics for Personal Blog (Step‑by‑Step)"
description: "How I added privacy‑friendly visitor statistics to a static Astro site using a tiny Node.js endpoint, SQLite, PM2, and Caddy."
pubDate: 2025-11-01
updateDate: 2026-01-30
tags:
  - IT
  - Linux
  - Caddy
  - Cloudflare
---

> Instead of using third‑party analytics like Cloudflare, I’m running a tiny **self‑hosted** tracker and you can also learn how it works and replicate it.

## What I've built

A tiny analytics API that:
- Accepts page‑view pings from this blog (`/track`)
- Provides comprehensive analytics via `/summary` and `/daily` endpoints
- Lets me export raw visits as CSV (`/export`)
- Stores data in a single `SQLite` file for easy backup/migration
- Runs forever with `pm2`, served over HTTPS with `Caddy`

You can adapt this for any static site (Astro, Hugo, etc.).

---

## 0) Prerequisites

- A cloud VM with a public IP
- A subdomain for the analytics endpoint
- Basic DNS access (Cloudflare etc.)
- Node.js 18+ and npm

> [!WARNING]  
> **Debian/Ubuntu users**: Do not use `sudo apt install nodejs npm` directly from the default repositories, as they often contain **severely outdated** Node.js versions (e.g., Node.js 10.x or 12.x) with **known security vulnerabilities** and **no security patches**. Always install from NodeSource to get current, supported versions.

### Debian/Ubuntu

```bash
sudo apt update && sudo apt upgrade -y

# Install latest Node.js LTS from NodeSource
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs git

# Verify installation
node --version  # Should show the latest LTS version
npm --version
```

### Fedora

> [!TIP]  
> Fedora's default repositories ship with **modern Node.js versions**. You can safely use the default repositories without NodeSource.

```bash
sudo dnf update -y

# Install Node.js from Fedora's default repositories
sudo dnf install -y nodejs npm git

# Verify installation
node --version  # Should show v22.x.x
npm --version
```

**Optional**: To install a specific version on Fedora:
```bash
# For Node.js 20.x LTS
sudo dnf module install nodejs:20

# For Node.js 18.x LTS
sudo dnf module install nodejs:18
```

---

## 1) Create the analytics service

Create a new folder and initialise a Node project:

> [!TIP]  
> I use `better-sqlite3` instead of `sqlite3` to avoid npm vulnerabilities and get better performance. It's synchronous (simpler) and has less security issues.

```bash
mkdir ~/page-stats && cd ~/page-stats
npm init -y
npm install express better-sqlite3 cors
```

Create `server.js`:

```js
const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const app = express();
app.set("trust proxy", 1);
app.set("json spaces", 2);
const db = new Database("stats.db");

const EXPORT_PASSWORD = "[PASSWORD]";

app.use(express.json({ limit: "2kb" }));
// Accept plain text for no-cors fetch (simple request)
app.use(express.text({ type: "text/plain", limit: "2kb" }));

// Initialise database (synchronous with better-sqlite3)
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 5000;
`);

db.exec(`CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT,
  referrer TEXT,
  ua TEXT,
  ip TEXT,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_visits_path ON visits(path)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_visits_ts ON visits(ts)`);

// Authentication middleware
const requireAuth = (req, res, next) => {
  const token = req.query.token;
  if (token !== EXPORT_PASSWORD) {
    return res.status(403).json({ error: "Forbidden: Invalid or missing token" });
  }
  next();
};

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

  const { path: rawPath, referrer: rawReferrer, ua } = body || {};
  const path = typeof rawPath === "string" ? rawPath : "";
  const referrer = typeof rawReferrer === "string" ? rawReferrer : "";
  const userAgent = ua || req.headers["user-agent"] || "";
  const ip = req.ip || "";

  if (!path) {
    console.warn("[analytics] Missing path field in request body");
    return res.sendStatus(400);
  }

  try {
    const stmt = db.prepare(`INSERT INTO visits (path, referrer, ua, ip) VALUES (?, ?, ?, ?)`);
    stmt.run(path, referrer, userAgent, ip);
    res.sendStatus(204);
  } catch (err) {
    console.error("DB insert error:", err);
    res.sendStatus(500);
  }
});

// CSV export
app.get("/export", requireAuth, (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM visits ORDER BY ts DESC`).all();
    const csv = [
      "id,path,referrer,ua,ip,ts",
      ...rows.map(r => `${r.id},"${r.path}","${r.referrer}","${r.ua}","${r.ip}","${r.ts}"`)
    ].join("\n");
    res.setHeader("Content-Disposition", "attachment; filename=stats.csv");
    res.type("text/csv").send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- Daily summary (views per day and path, last 30 days) ---
app.get("/daily", requireAuth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT DATE(ts) AS day, path, COUNT(*) AS views
      FROM visits
      WHERE ts >= DATE('now', '-30 days')
      GROUP BY day, path
      ORDER BY day DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Totals summary (overall + by path + by day, all-time) ---
app.get("/summary", requireAuth, (req, res) => {
  try {
    const totalRow = db.prepare(`
      SELECT
        COUNT(*) AS total_views,
        COUNT(DISTINCT path) AS unique_paths,
        MIN(ts) AS first_visit,
        MAX(ts) AS last_visit
      FROM visits
    `).get();

    const pathRows = db.prepare(`
      SELECT path, COUNT(*) AS views
      FROM visits
      GROUP BY path
      ORDER BY views DESC
    `).all();

    const dayRows = db.prepare(`
      SELECT DATE(ts) AS day, COUNT(*) AS views
      FROM visits
      GROUP BY day
      ORDER BY day DESC
    `).all();

    res.json({
      ...totalRow,
      by_path: pathRows,
      by_day: dayRows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(8080, () => console.log("Analytics server running on port 8080"));
```


Quick test:

```bash
node server.js
# In another shell:
curl -X POST http://localhost:8080/track \
  -H "Content-Type: text/plain" \
  -d '{"path":"/hello","referrer":""}'
curl "http://localhost:8080/summary?token=password"
```

You should see a JSON object with total views and breakdowns.

---

## 2) Keep it running with pm2

```bash
sudo npm install -g pm2
pm2 start server.js --name stats
pm2 startup
# Run the one-line command pm2 prints for systemd, then:
pm2 save
```

Check status:

```bash
pm2 ls
```

---

## 3) Obtain HTTPS with Caddy (reverse proxy)

Install Caddy: [Caddy install guide](https://caddyserver.com/docs/install)

### Create log directory

Before configuring Caddy, create the log directory with correct permissions:

```bash
sudo mkdir -p /var/log/caddy
sudo chown -R caddy:caddy /var/log/caddy
sudo chmod 755 /var/log/caddy
```

### Configure Caddyfile

Then configure `/etc/caddy/Caddyfile`:

```text
stats.zaku.eu.org {

    reverse_proxy localhost:8080

    root * /usr/share/caddy
    file_server

    header {
        Access-Control-Allow-Origin "https://zaku.eu.org"
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
If ports 80/443 are already in use, you can run Caddy on alternate ports (the URL must include the port):

```text
{
  http_port 8081
  https_port 8443
}

https://stats.zaku.eu.org:8443/stats {
  reverse_proxy localhost:8080
# Others remains the same as above
}
```

Note: for a publicly trusted TLS cert on non-443, you typically need DNS-01 validation (see below).

Remember to change the domain name to yours.  
Reload and tail logs:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
# Use reload after the service is running and you make future changes
sudo systemctl reload caddy
```

### Optional: DNS-01 with Cloudflare (when 80/443 are busy)

If you cannot free ports 80/443, use DNS-01 so Let's Encrypt validates via DNS. This requires a Caddy build with the Cloudflare DNS module.

1) Install Go (latest stable version):

> [!TIP]  
> Visit [https://go.dev/dl/](https://go.dev/dl/) to find the latest stable version. Replace `1.25.6` below with the current version number.

**Debian/Ubuntu:**

```bash
sudo apt remove -y golang-go golang || true
cd /tmp
# Replace 1.25.6 with the latest version from https://go.dev/dl/
curl -LO https://go.dev/dl/go1.25.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.6.linux-amd64.tar.gz
echo 'export PATH=/usr/local/go/bin:$PATH' | sudo tee /etc/profile.d/go.sh >/dev/null
source /etc/profile.d/go.sh
```

**Fedora/RHEL:**

```bash
sudo dnf remove -y golang || true
cd /tmp
# Replace 1.25.6 with the latest version from https://go.dev/dl/
curl -LO https://go.dev/dl/go1.25.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.6.linux-amd64.tar.gz
echo 'export PATH=/usr/local/go/bin:$PATH' | sudo tee /etc/profile.d/go.sh >/dev/null
source /etc/profile.d/go.sh
```

Verify:

```bash
go version
```

2) Lock Go to the local toolchain:

```bash
go env -w GOTOOLCHAIN=local
go env -w GOPROXY=https://proxy.golang.org,direct
```

3) Install xcaddy:

```bash
go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
export PATH="$PATH:$HOME/go/bin"
```

4) Build Caddy with the Cloudflare DNS module:

```bash
xcaddy build --with github.com/caddy-dns/cloudflare
```

5) Replace the system Caddy binary:

```bash
sudo systemctl stop caddy
sudo install -m 0755 ./caddy /usr/bin/caddy
sudo systemctl start caddy
```

6) Verify the module exists:

```bash
caddy list-modules | grep cloudflare
```

7) Create a Cloudflare API token with:

- `Zone.Zone:Read`
- `Zone.DNS:Edit`

Scope it to your zone.

8) Add the token to the Caddy systemd service:

```bash
sudo systemctl edit caddy
```

```ini
[Service]
Environment=CLOUDFLARE_API_TOKEN=YOUR_TOKEN_HERE
```

```bash
sudo systemctl daemon-reload
```

9) Update the Caddyfile:

```text
{
  http_port 8081
  https_port 8443
}

stats.zaku.eu.org {
  tls {
    dns cloudflare {env.CLOUDFLARE_API_TOKEN}
  }

  reverse_proxy localhost:8080

  root * /usr/share/caddy
  file_server

  header {
    Access-Control-Allow-Origin "https://zaku.eu.org"
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

With `https_port 8443` set, access the API at `https://stats.zaku.eu.org:8443` and update your tracking endpoint to include `:8443`.

10) Validate and reload:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
# Format the file if you want
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

11) Confirm issuance:

```bash
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
      referrer: document.referrer || ''
    });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'text/plain' });
        const ok = navigator.sendBeacon(endpoint, blob);
        if (ok) return;
      }
      fetch(endpoint, {
        method: 'POST',
        body: payload,
        keepalive: true,
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' }
      }).catch(err => console.warn('[analytics] fetch failed', err));
    } catch (err) {
      console.warn('[analytics] unexpected error', err);
    }
  })();
</script>
```

> [!HINT]  
> Privacy-focused browsers like **Mullvad Browser** and **Tor Browser** will block this tracking script by default. Users with ad blockers or privacy extensions will also not be tracked.

---

## 6) Verify end‑to‑end

From the browser:
- Visit the blog.

The analytics API includes three useful endpoints for viewing detailed statistics:

- **`/daily`**: Returns daily visit counts per path for the **last 30 days**. Useful for tracking recent trends over time.
- **`/summary`**: Returns **all-time totals** plus breakdowns by path and by day, suitable for comprehensive dashboard overviews.
- **`/export`**: Downloads all raw visit data as CSV for backup or analysis in external tools.

These endpoints make it easy to visualise daily activity or build a simple dashboard.

### `/daily` endpoint

Returns a JSON array with daily stats for each path:

```json
[
  {
    "day": "2025-10-30",
    "path": "/",
    "views": 12
  },
  {
    "day": "2025-10-30",
    "path": "/about",
    "views": 3
  },
  {
    "day": "2025-10-31",
    "path": "/",
    "views": 15
  }
]
```

Query it with:

```bash
curl "https://stats.zaku.eu.org/daily?token=password"
```

### `/summary` endpoint

Returns top-level summary stats plus breakdowns:

```json
{
  "total_views": 1234,
  "unique_paths": 8,
  "first_visit": "2025-10-01 09:00:00",
  "last_visit": "2025-10-31 11:45:12",
  "by_path": [
    { "path": "/", "views": 800 },
    { "path": "/about", "views": 120 }
  ],
  "by_day": [
    { "day": "2025-10-31", "views": 45 },
    { "day": "2025-10-30", "views": 38 }
  ]
}
```

Query it with:

```bash
curl "https://stats.zaku.eu.org/summary?token=password"
```

CSV export:

```bash
curl -L -o stats.csv "https://stats.zaku.eu.org/export?token=password"
```

> [!TIP]  
> All analytics endpoints can be accessed directly from your browser. Simply visit the URL with the token parameter:
> - `https://stats.zaku.eu.org/daily?token=password`
> - `https://stats.zaku.eu.org/summary?token=password`
> - `https://stats.zaku.eu.org/export?token=password` (downloads CSV)

---

## 7) Backup &amp; migrate (one‑file move)

All analytics live in `stats.db`. To migrate to a new VM:

### Step 1: Download from old VPS to local machine

On your **old VPS**:

```bash
# Stop the analytics service
pm2 stop stats
```

On your **local machine**:

```bash
# Download the database
scp user@OLD_VPS_IP:~/page-stats/stats.db ~/Downloads/stats.db
```

### Step 2: Upload to new VPS

On your **local machine**:

```bash
# Upload to new VPS
scp ~/Downloads/stats.db user@NEW_VPS_IP:~/page-stats/stats.db
```

On your **new VPS**:

```bash
# Start the analytics service
pm2 start ~/page-stats/server.js --name stats
```


---

## 8) Troubleshooting

- **"Cannot GET /"** when visiting the VM IP: normal — the API only responds to `/track`, `/summary`, `/daily`, and `/export`.
- **Mixed content blocked**: ensure the endpoint is **HTTPS** and CORS allows your blog origin.
- **DNS check fails**: gray‑cloud the `stats` record until the certificate is issued.
- **No data appears**: test with a direct `curl -X POST .../track` and check `pm2 logs`.

### Test your endpoint manually

You can manually test your tracking endpoint with:

```bash
curl -X POST http://localhost:8080/track \
  -H "Content-Type: text/plain" \
  -d '{"path":"/hello","referrer":""}'
curl "http://localhost:8080/summary?token=password"
```

A new entry appearing in `/summary` confirms your endpoint is working correctly.

---

Hooray! This blog now uses a **self‑hosted, portable, privacy‑friendly analytics** system. If you build your own, feel free to fork these snippets and adapt the endpoints to your domain.

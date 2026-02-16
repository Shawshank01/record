---
title: "Self‑Hosted Lightweight Analytics for Personal Blog (Step‑by‑Step)"
description: "How I added privacy‑friendly visitor statistics to a static Astro site using a tiny Node.js endpoint, SQLite, PM2, and Caddy."
pubDate: 2025-11-01
updateDate: 2026-02-16
tags:
  - IT
  - GNU/Linux
  - Fedora CoreOS
  - Debian
  - Ubuntu
  - Caddy
  - Cloudflare
  - Database
---

## Table of Contents

- [0) Prerequisites](#0-prerequisites)
- [1) Create the analytics service](#1-create-the-analytics-service)
- [2) Keep it running in the background](#2-keep-it-running-in-the-background)
- [3) Obtain HTTPS with Caddy](#3-obtain-https-with-caddy-reverse-proxy)
- [4) DNS (Cloudflare)](#4-dns-cloudflare)
- [5) Add the tracking snippet to the blog](#5-add-the-tracking-snippet-to-the-blog-astro)
- [6) Verify end-to-end](#6-verify-endtoend)
- [7) Backup & migrate](#7-backup--migrate)
- [8) Backup and Data Safety](#8-backup-and-data-safety)
- [9) Troubleshooting](#9-troubleshooting)

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

### Fedora CoreOS

> [!IMPORTANT]  
> Fedora CoreOS is an **immutable operating system** designed for containerized workloads. You cannot install packages directly with `dnf install`. Instead, use **toolbox** to create a mutable container environment.
> 
> For more information about Fedora CoreOS on GCP, see the [official documentation](https://docs.fedoraproject.org/en-US/fedora-coreos/provisioning-gcp/).

**Step 1: Create and enter a toolbox**

```bash
toolbox create
toolbox enter
```

**Step 2: Install Node.js inside the toolbox**

```bash
# Install Node.js from Fedora's default repositories
sudo dnf install -y nodejs npm git

# Verify installation
node --version  # Should show v22.x.x
npm --version
```

**Step 3: Work inside the toolbox**

All subsequent commands (creating the project, installing packages, running the server) should be executed **inside the toolbox**. The toolbox persists across reboots and you can re-enter it anytime with `toolbox enter`.

> [!TIP]  
> To exit the toolbox, type `exit`. To re-enter later, use `toolbox enter`.

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
const db = new Database("./data/stats.db");

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
      SELECT DATE(ts) AS day, path, ip, COUNT(*) AS views
      FROM visits
      WHERE ts >= DATE('now', '-30 days')
      GROUP BY day, path, ip
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

    const ipRows = db.prepare(`
      SELECT ip, COUNT(*) AS views
      FROM visits
      GROUP BY ip
      ORDER BY views DESC
    `).all();

    res.json({
      ...totalRow,
      by_path: pathRows,
      by_day: dayRows,
      by_ip: ipRows
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
```

In another shell:
```bash
curl -X POST http://localhost:8080/track \
  -H "Content-Type: text/plain" \
  -d '{"path":"/hello","referrer":""}'
curl "http://localhost:8080/summary?token=password"
```

You should see a JSON object with total views and breakdowns.

---

## 2) Keep it running in the background

### Debian/Ubuntu: pm2

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

Stop the service:

```bash
pm2 stop stats
```

Restart the service:

```bash
pm2 restart stats
```

Remove from PM2 (stops and removes from process list):

```bash
pm2 delete stats
```

Completely disable PM2 auto-start (removes systemd integration):

```bash
pm2 unstartup
# Run the command it suggests with sudo
```

Or manually disable the systemd service:

```bash
sudo systemctl disable pm2-ubuntu
sudo systemctl stop pm2-ubuntu
```

### Fedora CoreOS: Podman + Systemd

**Step 1: Create a Dockerfile (inside toolbox)**

Inside toolbox, in ~/page-stats directory
```bash
cat > Dockerfile <<'EOF'
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server.js ./
RUN mkdir -p /app/data
EXPOSE 8080
CMD ["node", "server.js"]
EOF
```

**Step 2: Exit toolbox and build the container image on the host**

```bash
exit
```

On the Fedora CoreOS host, build the image
```bash
cd ~/page-stats
podman build -t localhost/page-stats:latest .
```

**Step 3: Create a data directory for persistence**

> [!IMPORTANT]  
> **Why use a separate data directory:** Storing the database in `~/page-stats/data/` keeps it outside the container image, so it persists across container restarts. The application code (`server.js`, `node_modules`) stays in the image, so rebuilds with `podman build` always take effect.

Create the data directory:

```bash
mkdir -p ~/page-stats/data
```

**Step 4: Create systemd service**

Create systemd user service directory:

```bash
mkdir -p ~/.config/systemd/user/
```

Create the service file:

```bash
cat > ~/.config/systemd/user/page-stats.service <<'EOF'
[Unit]
Description=Page Stats Analytics Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
Restart=always
RestartSec=10
ExecStart=/usr/bin/podman run --rm --name page-stats \
  -p 8080:8080 \
  -v ~/page-stats/data:/app/data:Z \
  localhost/page-stats:latest

ExecStop=/usr/bin/podman stop -t 10 page-stats

[Install]
WantedBy=default.target
EOF
```

**Step 5: Enable and start the service**

Reload systemd:

```bash
systemctl --user daemon-reload
```

Enable service to start on boot:

```bash
loginctl enable-linger $USER
```

Start the service:

```bash
systemctl --user enable --now page-stats.service
```

Check status:

```bash
systemctl --user status page-stats.service
```

Stop the service:

```bash
systemctl --user stop page-stats.service
```

Restart the service:

```bash
systemctl --user restart page-stats.service
```

Disable and stop (removes from startup):

```bash
systemctl --user disable --now page-stats.service
```

**Step 6: View logs**

Follow logs in real-time:

```bash
journalctl --user -u page-stats.service -f
```

View recent logs:

```bash
journalctl --user -u page-stats.service -n 50
```

> [!IMPORTANT]  
> **Updating the code**: If you modify `server.js` (e.g., changing the password), you must rebuild the container image and restart the service:
> 
> ```bash
> cd ~/page-stats
> podman build -t localhost/page-stats:latest .
> systemctl --user restart page-stats.service
> ```
> 
> The container runs a snapshot of your code from when it was built, not the live file.

---

## 3) Obtain HTTPS with Caddy (reverse proxy)

### Debian/Ubuntu: Install Caddy

[Caddy install guide](https://caddyserver.com/docs/install)

### Fedora CoreOS: Install Caddy Static Binary

Download and install Caddy:

```bash
curl -o caddy 'https://caddyserver.com/api/download?os=linux&arch=amd64'
```

Make it executable:

```bash
chmod +x caddy
```

Move to system location:

```bash
sudo mv caddy /usr/local/bin/
```

Verify installation:

```bash
caddy version
```

Create Caddy user and group:

```bash
sudo groupadd --system caddy
sudo useradd --system --gid caddy --create-home --home-dir /var/lib/caddy --shell /usr/sbin/nologin caddy
```

Create systemd service:

```bash
sudo tee /etc/systemd/system/caddy.service > /dev/null <<'EOF'
[Unit]
Description=Caddy
Documentation=https://caddyserver.com/docs/
After=network.target network-online.target
Requires=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/local/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile --force
TimeoutStopSec=5s
LimitNOFILE=1048576
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF
```

### Create log directory

Before configuring Caddy, create the log directory with correct permissions:

```bash
sudo mkdir -p /var/log/caddy
sudo chown -R caddy:caddy /var/log/caddy
sudo chmod 755 /var/log/caddy
```

### Configure Caddyfile

Then configure `/etc/caddy/Caddyfile`:

```bash
sudo nano /etc/caddy/Caddyfile
```

Add the following:

```text
# Replace with your own domain and congratulations you have found my analytics domain ;-)
# Feel free to block it by using uBlock Origin if you don’t want me to know you are stalking me

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

> If ports 80/443 are already in use, you can run Caddy on alternate ports, and for a publicly trusted TLS cert on non-443, you typically need DNS-01 validation (see below optional).

Safely updating Caddy configurations
```bash
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
```

Start the service and check status:
```bash
sudo systemctl enable --now caddy
sudo systemctl status caddy -l --no-pager
```

Use reload after the service is running and you make future changes:
```bash
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

**Fedora CoreOS:**

```bash
cd /tmp
# Replace 1.25.6 with the latest version from https://go.dev/dl/
curl -LO https://go.dev/dl/go1.25.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.6.linux-amd64.tar.gz
echo 'export PATH=/usr/local/go/bin:$PATH' | sudo tee /etc/profile.d/go.sh > /dev/null
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

5) Replace the Caddy binary:

```bash
sudo systemctl stop caddy
sudo install -m 0755 ./caddy /usr/local/bin/caddy
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
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy -l --no-pager
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

    const endpoint = 'https://stats.zaku.eu.org/track';
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
    "ip": "203.0.113.10",
    "views": 8
  },
  {
    "day": "2025-10-30",
    "path": "/blog1",
    "ip": "198.51.100.5",
    "views": 4
  },
  {
    "day": "2025-10-30",
    "path": "/blog2",
    "ip": "203.0.113.10",
    "views": 3
  },
  {
    "day": "2025-10-31",
    "path": "/",
    "ip": "203.0.113.10",
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
    { "path": "/blog1", "views": 120 }
  ],
  "by_day": [
    { "day": "2025-10-31", "views": 45 },
    { "day": "2025-10-30", "views": 38 }
  ],
  "by_ip": [
    { "ip": "203.0.113.10", "views": 650 },
    { "ip": "198.51.100.5", "views": 340 }
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

## 7) Backup & migrate

All analytics live in `stats.db`. To migrate to a new VM:

### Debian/Ubuntu (PM2)

**On the old VPS:**

```bash
pm2 stop stats

# Checkpoint WAL to merge all data into the main database file
sqlite3 ~/page-stats/stats.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

**On your local machine:**

```bash
scp user@OLD_VPS_IP:~/page-stats/stats.db ~/Downloads/stats.db
scp ~/Downloads/stats.db user@NEW_VPS_IP:~/page-stats/stats.db
```

**On the new VPS:**

```bash
pm2 start ~/page-stats/server.js --name stats
```

### Fedora CoreOS (Podman)

**On the old VPS:**

```bash
# Stop the service
systemctl --user stop page-stats.service

# Back up the database
mkdir -p ~/backups
cp ~/page-stats/data/stats.db ~/backups/stats.db
```

**On your local machine:**

```bash
scp user@OLD_VPS_IP:~/backups/stats.db ~/Downloads/stats.db
scp ~/Downloads/stats.db user@NEW_VPS_IP:~/backups/stats.db
```

**On the new VPS:**

```bash
# Create the data directory and import the database
mkdir -p ~/page-stats/data
cp ~/backups/stats.db ~/page-stats/data/stats.db

# Start the service
systemctl --user start page-stats.service
```

---

## 8) Backup and Data Safety

> [!WARNING]  
> **Always maintain regular backups!** System updates, hardware failures, or accidental deletions can cause data loss.

### Automated CSV Export Backup

Set up a daily backup using the `/export` endpoint. This works on **both Debian/Ubuntu and Fedora CoreOS**.

**Create a backup script:**

```bash
mkdir -p ~/backups
nano ~/backups/backup-stats.sh
```

Add the following content (replace `YOUR_PASSWORD` with your actual password):

```bash
#!/bin/bash
BACKUP_DIR="$HOME/backups/analytics"
mkdir -p "$BACKUP_DIR"

# Export CSV from the analytics endpoint
curl -s "https://stats.zaku.eu.org/export?token=YOUR_PASSWORD" \
  -o "$BACKUP_DIR/stats-$(date +%Y-%m-%d).csv"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "stats-*.csv" -mtime +30 -delete

echo "Backup completed: $(date)"
```

Make it executable:

```bash
chmod +x ~/backups/backup-stats.sh
```

**Debian/Ubuntu: Schedule with cron (daily at 2 AM):**

```bash
crontab -e
```

Add this line:

```
0 2 * * * /home/YOUR_USERNAME/backups/backup-stats.sh >> /home/YOUR_USERNAME/backups/backup.log 2>&1
```

**Fedora CoreOS: Schedule with systemd timer (daily at 2 AM):**

Create the service unit:

```bash
cat > ~/.config/systemd/user/backup-stats.service <<'EOF'
[Unit]
Description=Backup analytics CSV

[Service]
Type=oneshot
ExecStart=%h/backups/backup-stats.sh
EOF
```

Create the timer unit:

```bash
cat > ~/.config/systemd/user/backup-stats.timer <<'EOF'
[Unit]
Description=Daily analytics backup

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
```

Enable and start the timer:

```bash
systemctl --user daemon-reload
systemctl --user enable --now backup-stats.timer
```

Verify the timer is active:

```bash
systemctl --user list-timers
```

### Fedora CoreOS: Backup the Database File

On Fedora CoreOS, the database is stored directly at `~/page-stats/data/stats.db`. You can back it up with a simple copy:

```bash
# Stop the service
systemctl --user stop page-stats.service

# Copy the database
cp ~/page-stats/data/stats.db ~/backups/stats-$(date +%Y-%m-%d).db

# Start the service
systemctl --user start page-stats.service
```

### Debian/Ubuntu: Direct Database Backup

On Debian/Ubuntu with PM2, use SQLite's built-in backup command (safe, works while the service is running):

```bash
sqlite3 ~/page-stats/stats.db ".backup '/home/YOUR_USERNAME/backups/stats-$(date +%Y-%m-%d).db'"
```

---

## 9) Troubleshooting

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

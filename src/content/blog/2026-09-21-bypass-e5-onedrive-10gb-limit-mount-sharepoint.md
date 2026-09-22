---
title: "Bypass E5 OneDrive 10GB Limit: Mount SharePoint"
description: "Bypass the Microsoft 365 Developer E5 10GB OneDrive limit and native macOS OneDrive sync bugs by mounting SharePoint as a virtual drive using Rclone and FUSE-T."
pubDate: 2026-09-21
tags:
  - macOS
  - MacPorts
  - Rclone
  - FUSE-T
  - Microsoft E5
  - OneDrive
  - SharePoint
---

This guide resolves the 10GB personal OneDrive quota limitation on Microsoft 365 Developer E5 subscriptions by leveraging the 1.24TB tenant-wide SharePoint storage pool.

It completely bypasses native macOS OneDrive client issues, such as `fileproviderd` circular deadlocks, 0% progress freezes, and high CPU spikes during large file transfers, by delivering a native-like virtual drive with automated space reclamation (on-demand caching) and high-throughput streaming uploads.

---

## 1. Prerequisites and Installation

Mounting a cloud drive as a local filesystem via Rclone on macOS requires a FUSE framework. FUSE-T is recommended because it runs purely in user space and eliminates the need to reboot into Recovery Mode or lower system security settings.

### Step 1: Install FUSE-T

1. Visit the [FUSE-T GitHub Releases](https://github.com/macos-fuse-t/fuse-t/releases) page.
2. Download and run the latest `fuse-t-macos-installer-x.x.x.pkg` installer.

### Step 2: Install Rclone with Mount Support via MacPorts

The default `rclone` port in MacPorts does not include mount capabilities. Install it with the `+mount` variant:

```bash
sudo port selfupdate
sudo port install rclone +mount
```

---

## 2. Configure Rclone with SharePoint

Authorize and bind the dedicated SharePoint site using Rclone's built-in configuration wizard:

1. **Start the wizard**:

   ```bash
   rclone config
   ```

2. **Configuration Prompts**:

   - Enter `n` to create a new remote, and name it `sp` (or whatever you want).
   - `Storage>`: Find `Microsoft OneDrive` and choose it (handles both OneDrive and SharePoint).
   - `client_id>` / `client_secret>`: Press Enter to leave blank (uses default application credentials).
   - `region>`: Enter `1` (Microsoft Cloud Global).
   - `tenant>`: Press Enter to leave blank (not needed for interactive personal OAuth).
   - `Edit advanced config?>`: Enter `n`.
   - `Use web browser to automatically authenticate?>`: Enter `y`. A browser tab will open automatically. Sign in with your E5 tenant credentials and grant the requested permissions.

3. **Select the Target SharePoint Site**:

   - Return to the terminal after successful browser authorisation. When prompted for the storage type, enter `2` (SharePoint site).
   - Rclone will list all SharePoint sites in your tenant. Enter the corresponding numerical index for your target team site.
   - Select the document library by entering the numerical index for `Documents` or just use the root one.

4. **Save and Exit**:

   - Review the configuration summary, enter `y` to confirm, and enter `q` to quit the wizard.

---

## 3. Manual Mount & Connectivity Test (Optional)

Configuring the local Virtual File System (VFS) cache creates a seamless experience equivalent to OneDrive's "Files On-Demand": files appear as 0-byte local placeholders, and cached files are automatically cleared from local storage after upload or playback.

> [!NOTE]
> This section is intended for manually testing whether the virtual drive mounts and operates correctly. If you prefer to configure Rclone directly as a persistent background service that starts automatically at login, you can verify your mount here and proceed to [Section 4](#4-configure-automated-startup-at-login-macos-launchd).

### Step 1: Create the Local Mount Point

```bash
mkdir -p ~/SharePoint
```

### Step 2: Execute the Mount Command

Run the following optimized mount command in the foreground to test connectivity and review terminal logs:

```bash
/opt/local/bin/rclone mount sp: ~/SharePoint \
  --vfs-cache-mode full \
  --vfs-cache-max-age 12h \
  --vfs-cache-max-size 250G \
  --vfs-cache-poll-interval 1m \
  --vfs-write-back 5s \
  --onedrive-chunk-size 125M \
  --buffer-size 64M \
  --volname "SharePoint" \
  --rc \
  --rc-web-gui \
  --rc-web-gui-no-open-browser \
  --rc-addr 127.0.0.1:5572 \
  --rc-no-auth
```

> [!NOTE]
> Running in the foreground (without `--daemon`) lets you inspect real-time log output, verify connectivity, and confirm that the Web GUI initializes properly. Once you have confirmed that the mount functions as expected, press `Ctrl + C` in Terminal to cleanly terminate the test run, then proceed to [Section 4](#4-configure-automated-startup-at-login-macos-launchd) to set up persistent background startup.

### Key Parameters Explained

| Parameter | Core Behavior & Purpose |
| :--- | :--- |
| `--vfs-cache-mode full` | Enables a comprehensive cache layer. Allows sequential and random access (seeking) on large videos without data corruption. |
| `--vfs-cache-max-age 12h` | Automatic Space Freeing: Deletes the local SSD cache of any file that has not been read or written to for 12 hours, returning local disk consumption to zero. |
| `--vfs-cache-max-size 250G` | Caps maximum local cache size. Cleans older cached chunks using an LRU (least-recently-used) policy if this threshold is reached. |
| `--vfs-cache-poll-interval 1m` | Scans the local cache directory once per minute to evict expired or overflowing data promptly. |
| `--vfs-write-back 5s` | Delays upload until 5 seconds after a file is closed, preventing lockups caused by simultaneous writing and uploading. |
| `--onedrive-chunk-size 125M` | Increases upload chunk size to 125MB (a multiple of 320KiB required by Microsoft's API), optimizing throughput on high-speed internet. |
| `--buffer-size 64M` | Allocates a 64MB read-ahead buffer in RAM for each open file to absorb network latency fluctuations during video playback. |
| `--volname "SharePoint"` | Displays the mount as an external drive named "SharePoint" on your desktop and Finder sidebar. |
| `--rc` | Enables Rclone's Remote Control (RC) HTTP server for control and monitoring. |
| `--rc-web-gui` | Serves the official Rclone Web GUI interface dashboard. |
| `--rc-web-gui-no-open-browser` | Prevents the default browser from automatically launching when the mount command starts. |
| `--rc-addr 127.0.0.1:5572` | Binds the Web GUI to `http://127.0.0.1:5572` locally. |
| `--rc-no-auth` | Disables username and password authentication for local access on loopback (`127.0.0.1`). |

> [!TIP]
> Once mounted, open `<http://127.0.0.1:5572>` in your browser to access the Rclone Web GUI and monitor transfer speeds, active jobs, and bandwidth usage in real time.
>
> - **First launch package download**: Rclone does not bundle Web GUI frontend assets into the binary. On first run with `--rc-web-gui`, Rclone will automatically fetch the web dashboard package (~5MB) from GitHub into its cache, taking a couple of seconds before the page is reachable.
> - **Empty "Mounts" tab is normal**: The Web GUI's **Mounts** tab and `mount/listmounts` API only display mounts created dynamically via the Web UI itself. Standalone CLI/Launchd mounts are managed externally and intentionally do not appear in that list, but all active sync operations and transfer bandwidth are fully monitored on the **Dashboard**.

---

## 4. Configure Automated Startup at Login (macOS Launchd)

Use macOS's native `launchd` service to maintain persistent, background mounting upon system login.

### Step 1: Generate the LaunchAgent Configuration

Run the following command in Terminal to create the agent configuration file:

```bash
mkdir -p ~/SharePoint
mkdir -p ~/Library/LaunchAgents
mkdir -p ~/.config/rclone

cat << EOF > ~/Library/LaunchAgents/com.user.rclone.sharepoint.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.user.rclone.sharepoint</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/local/bin:/opt/local/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/local/bin/rclone</string>
        <string>mount</string>
        <string>sp:</string>
        <string>$HOME/SharePoint</string>
        <string>--vfs-cache-mode</string>
        <string>full</string>
        <string>--vfs-cache-max-age</string>
        <string>12h</string>
        <string>--vfs-cache-max-size</string>
        <string>250G</string>
        <string>--vfs-cache-poll-interval</string>
        <string>1m</string>
        <string>--vfs-write-back</string>
        <string>5s</string>
        <string>--onedrive-chunk-size</string>
        <string>125M</string>
        <string>--buffer-size</string>
        <string>64M</string>
        <string>--volname</string>
        <string>SharePoint</string>
        <string>--rc</string>
        <string>--rc-web-gui</string>
        <string>--rc-web-gui-no-open-browser</string>
        <string>--rc-addr</string>
        <string>127.0.0.1:5572</string>
        <string>--rc-no-auth</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/.config/rclone/sharepoint-mount.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.config/rclone/sharepoint-mount.log</string>
</dict>
</plist>
EOF
```

> [!IMPORTANT]
> **Why `EnvironmentVariables` (`PATH`) is mandatory**: By default, macOS `launchd` executes jobs with an extremely minimal `$PATH` (`/usr/bin:/bin:/usr/sbin:/sbin`). FUSE-T depends on auxiliary helper tools located in `/usr/local/bin` to attach the virtual filesystem to macOS. Without explicit `PATH` definitions, Rclone's VFS cache and Web GUI will run and upload files in the background, but the filesystem mount will silently fail to register in Finder.

### Step 2: Activate the Service

```bash
# Unload previous service to prevent launchd from immediately respawning rclone
launchctl unload ~/Library/LaunchAgents/com.user.rclone.sharepoint.plist 2>/dev/null

# Terminate any existing manual instances and cleanly unmount
killall rclone 2>/dev/null
diskutil unmount force ~/SharePoint 2>/dev/null || umount -f ~/SharePoint 2>/dev/null

# Load and start the background service
launchctl load ~/Library/LaunchAgents/com.user.rclone.sharepoint.plist
```

> [!TIP]
> Unloading before terminating processes prevents a race condition where `launchd`'s `<key>KeepAlive</key><true/>` policy immediately revives `rclone` upon detecting process termination. Furthermore, running `launchctl unload` prior to `launchctl load` ensures idempotency if you update parameters in `.plist` later, avoiding `service already loaded` errors.

The SharePoint drive will now automatically mount in Finder upon every login.

> [!TIP]
> **If the drive icon does not appear on your Desktop or Finder sidebar**:
> FUSE-T mounts the drive as a network filesystem (NFS). Ensure macOS allows displaying connected network volumes:
>
> 1. Open **Finder** → press `Cmd + ,` (**Settings** / **Preferences**).
> 2. Under the **General** tab, check **Connected servers**.
> 3. Under the **Sidebar** tab, ensure **Connected servers** is checked under **Locations**.
>
> *Alternatively, navigate to `~/SharePoint` in Finder and drag the folder directly into your **Favorites** sidebar for one-click access.*

---

## 5. Maintenance and Operations

### Manually Free All Local Space Immediately

> [!WARNING]
> **Data Loss Risk**: Before running this command, verify that all files have finished uploading to the cloud. You can check the **Transfers** tab in the Web GUI (`http://127.0.0.1:5572`) to confirm there are no active tasks, or check Activity Monitor to ensure `rclone` network egress has dropped to zero.
>
> **Never clear this directory while uploads are in progress**, as files queued in the local buffer will be permanently erased before reaching the cloud, causing irrecoverable data loss or corrupted remote files.

To instantly wipe the local cache without affecting cloud files, delete the local cache and metadata folders:

```bash
rm -rf ~/Library/Caches/rclone/vfs*
```

### Safe Unmounting

Do not drag the mounted volume to the Trash. Unmount according to how the drive was launched:

- **If running via Launchd background service (Section 4)**:
  Unload the service directly. This terminates Rclone cleanly and automatically unmounts the volume:

  ```bash
  launchctl unload ~/Library/LaunchAgents/com.user.rclone.sharepoint.plist
  ```

- **If running manually via Terminal (Section 3)**:
  Unmount the mount point directly:

  ```bash
  diskutil unmount ~/SharePoint 2>/dev/null || umount ~/SharePoint
  ```

  *(If the process is busy or unresponsive, terminate it with `killall rclone`)*

### Inspecting and Truncating Logs

By default, Rclone runs at the `NOTICE` logging level, keeping log file growth negligible (typically under 1MB per year) while routine transfers are monitored via the Web GUI.

To view live log output in Terminal:

```bash
tail -f ~/.config/rclone/sharepoint-mount.log
```

If you ever wish to instantly truncate and free log file space without restarting the background service:

```bash
: > ~/.config/rclone/sharepoint-mount.log
```

### Managing AppleDouble (`._*`) and `.DS_Store` Companion Files

When copying files with extended attributes (such as quarantine flags from browser downloads, AirDrop metadata, or Finder tags) to a virtual or network filesystem, macOS automatically generates companion metadata files prefixed with `._` (AppleDouble format).

Understanding how macOS and Rclone handle these companion files resolves common sync puzzles:

1. **Disable `.DS_Store` Generation on Network Stores (System Optimisation)**:

   Run this native macOS command to instruct Finder never to create `.DS_Store` files on network shares and FUSE mounts, then restart Finder to apply the change immediately:

   ```bash
   defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool TRUE
   killall Finder
   ```

   You can verify that the setting took effect (should output `1`):

   ```bash
   defaults read com.apple.desktopservices DSDontWriteNetworkStores
   ```

   > [!NOTE]
   > `DSDontWriteNetworkStores` exclusively suppresses `.DS_Store`. It has zero effect on AppleDouble (`._*`) files, which macOS treats as essential file metadata forks.

2. **Why `--exclude` is Omitted & Preventing `._*` Companion Files**:

   In `rclone mount`, `--exclude` acts purely as a **read/visibility filter**—it hides files from Finder, but it does *not* intercept or block files written into the local VFS mount by macOS. Adding `--exclude "._*"` creates an illusion: Finder writes `._filename`, Rclone uploads it to SharePoint anyway, and then hides it from your local view so you cannot even see or delete it with normal `rm` commands.

   Omitting `--exclude` keeps your local view completely consistent with cloud storage. To actually stop macOS from generating and uploading `._*` companion files:

   - **Strip Extended Attributes Before Copying**: Remove metadata (quarantine, tags) so macOS sees clean data files:

     ```bash
     # Single file or folder:
     xattr -c "filename.jpg"

     # Entire directory recursively:
     xattr -cr /path/to/folder
     ```

   - **Copy via Terminal without Extended Attributes**:

     ```bash
     cp -X "filename.jpg" ~/SharePoint/
     # Or for directories:
     cp -RX /path/to/folder ~/SharePoint/
     ```

3. **Purge Stuck Companion Files from Local Cache**:

   If your current transfer queue is stuck retrying `._*` or `.DS_Store` files, delete them from the local cache to allow legitimate files to proceed:

   ```bash
   find ~/Library/Caches/rclone/vfs -name "._*" -delete 2>/dev/null
   find ~/Library/Caches/rclone/vfs -name ".DS_Store" -delete 2>/dev/null
   find ~/Library/Caches/rclone/vfsMeta -name "._*" -delete 2>/dev/null
   find ~/Library/Caches/rclone/vfsMeta -name ".DS_Store" -delete 2>/dev/null
   ```

4. **Purge Existing Companion Files from SharePoint**:

   To mass-delete any lingering `._*` and `.DS_Store` files directly from SharePoint:

   ```bash
   /opt/local/bin/rclone delete sp: --include "._*" --include ".DS_Store"
   ```

### Preventing SharePoint Version Bloat (Critical)

> [!WARNING]
> To prevent minor file modifications or metadata changes on large videos from consuming the 1.24TB pool through version history, adjust document versioning settings:

1. Navigate to your SharePoint site document library in a web browser.
2. Click the gear icon (**Settings**) → **Library settings** → **More library settings** → **Versioning settings**.
3. Under **Document Version History**, select **No versioning** and click **OK** at the bottom.

---

## 6. Architectural Trade-offs & Ideal Workflows

You've finally broken free from OneDrive's sickeningly broken behaviour of SharePoint on macOS, a disaster born from corporate politics between Apple and Microsoft. With this setup in place, here is what you've gained:

1. **Large Media & Video Streaming**:  
   Unlike the native OneDrive client, which often forces downloading entire multi-gigabyte files before playback, Rclone with `--vfs-cache-mode full` and `--buffer-size 64M` handles byte-range requests seamlessly. Media players like IINA, Infuse, or VLC can seek anywhere across a 50GB 4K video with near-instant buffering. The local cache automatically evicts stale chunks after 12 hours, freeing SSD space automatically.
2. **Eliminating macOS Sync Deadlocks**:  
   Bypasses Apple's `fileproviderd` architecture completely, eliminating circular upload freezes, 0% progress bugs, and high CPU lockups during large transfers.
3. **True Cloud Capacity**:  
   Unlocks the tenant-wide SharePoint storage pool, bypassing Microsoft's strict 10GB personal OneDrive quota on Developer E5 accounts.

However, if you want to make your life a lot easier, pay close attention to this:

1. **High Overhead on Thousands of Small Files**:  
   Uploading a single 10GB video requires one continuous stream that saturates available network bandwidth. In contrast, copying a directory containing 30,000 fragmented files (such as `node_modules` or unpacked game assets) requires tens of thousands of individual REST API calls to Microsoft Graph. This creates severe network round-trip latency and quickly triggers **HTTP 429 (Too Many Requests)** rate limiting from Microsoft.

2. **SharePoint Property Promotion (The Metadata Injection Trap)**:  
   SharePoint is an enterprise document collaboration engine rather than transparent object storage. When certain files are uploaded, SharePoint's internal parsers crack open the file and inject tenant metadata, schema properties, UUIDs, or security wrapper headers. This alters the file's binary contents and changes its size by a few hundred bytes. Rclone immediately flags this discrepancy as `corrupted on transfer: sizes differ` and endlessly retries uploading them at 100% every minute.

   **Formats altered by SharePoint include**:
   - **Microsoft Office Documents**: `.docx`, `.xlsx`, `.pptx`, `.vsdx` (Word, Excel, PowerPoint, Visio)
   - **Macro & Template Files**: `.docm`, `.xlsm`, `.pptm`, `.dotx`
   - **Web & Markup Files**: `.html`, `.htm`, `.aspx`, `.shtml` (Game manuals, offline documentation, web rips)
   - **Outlook Message Files**: `.msg`, `.eml`
   - **Tagged Images**: `.tif`, `.tiff`
   - **Internet Shortcuts**: `.url`, `.website`
   - **PDFs**: `.pdf` (in tenants with Microsoft Purview sensitivity labeling or metadata policies enabled)

   > [!NOTE]
   > Standard images (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`), video/audio media (`.mkv`, `.mp4`, `.mov`, `.flac`, `.mp3`), disc images (`.iso`, `.dmg`), and compressed archives (`.zip`, `.7z`, `.tar`) have no SharePoint document parsers attached to them. They are stored bit-for-bit identical with zero modification.

### The Golden Rule: Large Files Directly, Small Files Zipped

- **Directly to Mount**: Movies, TV series, photo libraries, disc images (`.iso`, `.dmg`), virtual machine disks, and pre-packaged archives.
- **Zip First Locally**: Code repositories, game installation directories, emulator ROM collections, and folders containing thousands of small files or HTML manuals. Compress them into a single `.zip` or `.7z` file before moving them to the mount. This avoids API rate limiting, preserves byte-for-byte integrity, and guarantees maximum upload throughput.

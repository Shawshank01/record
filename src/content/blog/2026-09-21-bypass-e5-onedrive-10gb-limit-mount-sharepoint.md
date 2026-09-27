---
title: "Bypass E5 OneDrive 10GB Limit: Mount SharePoint"
description: "Bypass Microsoft 365 Developer E5 10GB OneDrive limits and native macOS sync bugs by mounting an encrypted SharePoint drive using Rclone Crypt and FUSE-T."
pubDate: 2026-09-21
updateDate: 2026-09-27
tags:
  - macOS
  - MacPorts
  - Rclone
  - FUSE-T
  - Microsoft E5
  - OneDrive
  - SharePoint
---

This guide resolves the 10GB personal OneDrive quota limitation on Microsoft 365 Developer E5 subscriptions by leveraging the 1.24TB tenant-wide SharePoint storage pool with end-to-end client-side encryption via **Rclone Crypt**.

![jxl hint](/2026-09-21/sharepoint-storage.jxl)

It completely bypasses native macOS OneDrive client issues, such as `fileproviderd` circular deadlocks, 0% progress freezes, high CPU spikes, and SharePoint's metadata injection into Office documents, by delivering an encrypted native virtual drive with automated space reclamation (on-demand caching) and transparent on-the-fly decryption.

---

## 1. Prerequisites and Installation

Mounting a cloud drive as a local filesystem on macOS requires **MacPorts** (to install Rclone with mount capabilities) and **FUSE-T** (which provides a user-space FUSE implementation without requiring macOS kernel extensions or lowering system security settings).

### Step 1: Install MacPorts

If you do not already have MacPorts installed on your Mac:

1. Install the Xcode Command Line Tools:

   ```bash
   xcode-select --install
   ```

2. Download and run the official package installer matching your macOS version from the [MacPorts Installation Guide](https://www.macports.org/install.php).
3. Open a new Terminal window and verify that the `port` command is available:

   ```bash
   port version
   ```

### Step 2: Install FUSE-T

Mounting a cloud drive as a local filesystem via Rclone on macOS requires a FUSE framework. FUSE-T is recommended because it runs purely in user space and eliminates the need to reboot into Recovery Mode or lower system security settings:

1. Visit the [FUSE-T GitHub Releases](https://github.com/macos-fuse-t/fuse-t/releases) page.
2. Download and run the latest `fuse-t-macos-installer-x.x.x.pkg` installer.

### Step 3: Install Rclone with Mount Support via MacPorts

The default `rclone` port in MacPorts does not include mount capabilities. Install it with the `+mount` variant:

```bash
sudo port selfupdate
sudo port install rclone +mount
```

---

## 2. Configure Rclone with SharePoint and Crypt

To ensure total data privacy, prevent SharePoint from corrupting Office files with injected metadata, and eliminate filename character restrictions, we configure a base SharePoint remote and overlay it with Rclone's native encryption layer (`crypt`).

### Step 1: Authorize the SharePoint Base Remote (`sp`)

Authorize and bind the dedicated SharePoint site using Rclone's built-in configuration wizard:

1. **Start the wizard**:

   ```bash
   rclone config
   ```

2. **Configuration Prompts**:

   - Enter `n` to create a new remote, and name it `sp`.
   - `Storage>`: Find `Microsoft OneDrive` and choose it (handles both OneDrive and SharePoint).
   - `client_id>` / `client_secret>`: Press Enter to leave blank (uses default application credentials).
   - `region>`: Enter `1` (Microsoft Cloud Global).
   - `tenant>`: Press Enter to leave blank (not needed for interactive personal OAuth).
   - `Edit advanced config?>`: Enter `n`.
   - `Use web browser to automatically authenticate?>`: Enter `y`. A browser tab will open automatically. Sign in with your E5 tenant credentials and grant the requested permissions.

3. **Select the Target SharePoint Site**:

   - Return to the terminal after successful browser authorisation. When prompted for the storage type, enter `2` (SharePoint site).
   - Rclone will list all SharePoint sites in your tenant. Enter the corresponding numerical index for your target team site.
   - Select the document library by entering the numerical index for `Documents` or the site root.

4. **Confirm the Base Remote**:

   - Review the configuration summary and enter `y` to confirm.

### Step 2: Create the Encrypted Overlay Remote (`sp-crypt`)

Overlay the base SharePoint remote with Rclone's native client-side encryption:

1. In the `rclone config` menu, enter `n` to create a second remote.
2. Name the remote `sp-crypt`.
3. For `Storage>`, enter `crypt` (or select the number for **Encrypt/Decrypt a remote**).
4. For `remote>`, specify the base remote and target storage folder:

   ```text
   sp:vault
   ```

   *This stores all encrypted blobs inside a dedicated `vault` folder in your SharePoint document library, leaving the rest of your SharePoint available for regular files if needed.*
5. For `filename_encryption>`, enter `1` (**Standard**) to fully encrypt filenames into randomized alphanumeric strings.
6. For `directory_name_encryption>`, enter `true` (or `1`) to encrypt directory names.
7. For `password>`, enter `g` to **generate a random password** (recommended over a manual password for maximum cryptographic security):
   - When prompted for `Password strength in bits`, enter `128` or `1024`.
   - Enter `y` to confirm the generated password, and immediately save it in your password manager.
   - *(Alternatively, enter `y` if you prefer to type in your own passphrase).*
8. For `password2>` (salt), enter `g` to generate a random salt phrase as well:
   - When prompted for bits, enter `128` or `1024`.
   - Enter `y` to confirm, and save the salt alongside your password in your password manager.
   - *(Alternatively, enter `y` to type a custom salt, or `n` to skip, though adding a salt is strongly recommended).*
9. Press Enter to skip advanced configuration, review the summary, enter `y` to save, and enter `q` to quit the wizard.

> [!CAUTION]
> **Backup Your Password and Salt**: Rclone uses standard, zero-knowledge encryption (XSalsa20 + Poly1305). There is no password recovery or reset mechanism. Store both your password and salt safely in a password manager. With these two keys, you can decrypt and access your files on any Mac, Linux, or Windows system.

---

## 3. Manual Mount & Connectivity Test (Optional)

Configuring the local Virtual File System (VFS) cache provides seamless on-demand access: files are listed in Finder at their full remote sizes, while local cache files are allocated sparsely so that only read or written byte ranges consume SSD storage. Cached chunks remain available for immediate re-access and are automatically evicted by age (`--vfs-cache-max-age 12h`) or size limits (`--vfs-cache-max-size 50G`).

> [!NOTE]
> This section is intended for manually testing whether the virtual drive mounts and operates correctly. If you prefer to configure Rclone directly as a persistent background service that starts automatically at login, you can verify your mount here and proceed to [Section 4](#4-configure-automated-startup-at-login-macos-launchctl).

### Step 1: Create the Local Mount Point

```bash
mkdir -p ~/SharePoint
```

### Step 2: Execute the Mount Command

Run the following optimized mount command in the foreground to test connectivity and review terminal logs:

```bash
/opt/local/bin/rclone mount sp-crypt: ~/SharePoint \
  --vfs-cache-mode full \
  --vfs-cache-max-age 12h \
  --vfs-cache-max-size 50G \
  --vfs-cache-poll-interval 1m \
  --poll-interval 1m \
  --vfs-write-back 5s \
  --onedrive-chunk-size 125M \
  --buffer-size 64M \
  --volname "SharePoint" \
  --rc \
  --rc-addr 127.0.0.1:5572 \
  --rc-no-auth
```

> [!NOTE]
> Running in the foreground (without `--daemon`) lets you inspect real-time log output, verify connectivity, and confirm that the filesystem mounts properly. Once you have confirmed that the mount functions as expected, press `Ctrl + C` in Terminal to cleanly terminate the test run, then proceed to [Section 4](#4-configure-automated-startup-at-login-macos-launchctl) to set up persistent background startup.

### Key Parameters Explained

| Parameter | Core Behavior & Purpose |
| :--- | :--- |
| `--vfs-cache-mode full` | Enables a comprehensive cache layer. Allows sequential and random access (seeking) on large videos without data corruption. |
| `--vfs-cache-max-age 12h` | Automatic Space Freeing: Deletes the local SSD cache of any file that has not been read or written to for 12 hours, returning local disk consumption to zero. |
| `--vfs-cache-max-size 50G` | Caps maximum local cache size. Cleans older cached chunks using an LRU (least-recently-used) policy if this threshold is reached. |
| `--vfs-cache-poll-interval 1m` | Scans the local cache directory once per minute to evict expired or overflowing data promptly. |
| `--poll-interval 1m` | Delta Polling: Queries Microsoft Graph every minute for changes, ensuring additions or deletions made in the cloud reflect in Finder promptly. |
| `--vfs-write-back 5s` | Delays upload until 5 seconds after a file is closed, preventing lockups caused by simultaneous writing and uploading. |
| `--onedrive-chunk-size 125M` | Increases upload chunk size to 125MB (a multiple of 320KiB required by Microsoft's API), optimizing throughput on high-speed internet. |
| `--buffer-size 64M` | Allocates a 64MB read-ahead buffer in RAM for each open file to absorb network latency fluctuations during video playback. |
| `--volname "SharePoint"` | Displays the mount as an external drive named "SharePoint" on your desktop and Finder sidebar. |
| `--rc` | Enables Rclone's Remote Control (RC) HTTP server, allowing web dashboards and CLI tools to control and monitor the mount. |
| `--rc-addr 127.0.0.1:5572` | Binds the RC API server to `http://127.0.0.1:5572` locally. |
| `--rc-no-auth` | Disables authentication for loopback access (`127.0.0.1`), allowing the local web dashboard to connect seamlessly. |

> [!TIP]
> **Transparent Client-Side Decryption**:  
> Even though all data stored in the cloud is encrypted with AES-256 via `sp-crypt:`, the local mount at `~/SharePoint` functions completely transparently. Finder displays normal filenames and directories, and files can be opened, edited, or streamed without any manual decryption steps.

### Real-Time Monitoring with Rclone Web

With the Remote Control (RC) API exposed locally on `127.0.0.1:5572`, you can monitor live transfer throughput, active upload queues, and bandwidth statistics without interrupting the mount.

#### Testing the Dashboard On-Demand

The modern official web interface **[Rclone Web](https://github.com/rclone/rclone-web)** is bundled directly into latest Rclone releases.

During foreground testing in Step 2, you can launch and test the dashboard simply by running this in a separate Terminal tab:

```bash
rclone gui
```

- **Instant Browser Launch**: Automatically launches the embedded web interface and opens your default browser pre-authenticated.
- **Zero Process Conflicts**: Operates cleanly alongside your foreground mount test.
- **Permanent 24/7 Access**: For persistent, fixed-port (`5580`) monitoring that runs silently in the background and auto-starts upon login without manual Terminal commands, proceed to Section 4.

---

## 4. Configure Automated Startup at Login (macOS Launchctl)

Use macOS's native `launchctl` service to maintain persistent, background mounting and live dashboard monitoring upon system login.

> [!NOTE]
> **Why `launchctl` + `rclone-web` is the default architecture**:  
> Standalone desktop GUI wrappers are designed to spawn and supervise their own internal Rclone processes. Running them alongside macOS `launchctl` creates process collisions and launch conflicts.  
> The decoupled architecture used here, **macOS `launchctl` managing the daemon in the background, paired with `rclone-web` as a passive web dashboard**, provides seamless, uninterrupted startup upon login while letting you inspect metrics on demand.

### Step 1: Generate the LaunchAgent Configurations

#### 1. Filesystem Mount Service (`com.user.rclone.sharepoint.plist`)

Run the following command to create the directory structure and the primary virtual drive mount service:

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
        <string>sp-crypt:</string>
        <string>$HOME/SharePoint</string>
        <string>--vfs-cache-mode</string>
        <string>full</string>
        <string>--vfs-cache-max-age</string>
        <string>12h</string>
        <string>--vfs-cache-max-size</string>
        <string>50G</string>
        <string>--vfs-cache-poll-interval</string>
        <string>1m</string>
        <string>--poll-interval</string>
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
        <string>--rc-addr</string>
        <string>127.0.0.1:5572</string>
        <string>--rc-no-auth</string>
        <string>--rc-allow-origin</string>
        <string>http://127.0.0.1:5580</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    <key>ThrottleInterval</key>
    <integer>10</integer>
    <key>StandardOutPath</key>
    <string>$HOME/.config/rclone/sharepoint-mount.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.config/rclone/sharepoint-mount.log</string>
</dict>
</plist>
EOF
```

> [!IMPORTANT]
>
> - **`PATH`**: Ensures auxiliary tools and user-space helper symlinks in `/usr/local/bin` can be resolved by background jobs.
> - **`--rc-allow-origin`**: Restricts CORS access strictly to `http://127.0.0.1:5580`, preventing arbitrary browser origins from querying your unauthenticated loopback API.

#### 2. Companion Web GUI Service (`com.user.rclone.gui.plist`)

Run the following command to create the companion web dashboard service:

```bash
cat << 'EOF' > ~/Library/LaunchAgents/com.user.rclone.gui.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.user.rclone.gui</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/local/bin/rclone</string>
        <string>gui</string>
        <string>--addr</string>
        <string>127.0.0.1:5580</string>
        <string>--api-addr</string>
        <string>127.0.0.1:5582</string>
        <string>--no-auth</string>
        <string>--no-open-browser</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    <key>ThrottleInterval</key>
    <integer>10</integer>
    <key>StandardOutPath</key>
    <string>/dev/null</string>
    <key>StandardErrorPath</key>
    <string>/dev/null</string>
</dict>
</plist>
EOF
```

### Step 2: Activate the Services

```bash
# Ensure the target mount point is clean and unmounted
diskutil unmount force ~/SharePoint 2>/dev/null || umount -f ~/SharePoint 2>/dev/null

# Bootstrap and start both background services in the modern user GUI domain
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.user.rclone.sharepoint.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.user.rclone.gui.plist
```

The SharePoint drive will now automatically mount in Finder upon every login.

> [!TIP]
> **Bookmark Your 24/7 Live Dashboard**:  
> Once loaded, open and bookmark:  
> `http://127.0.0.1:5580/login?url=http://127.0.0.1:5572/`  
>
> Passing `?url=http://127.0.0.1:5572/` connects GUI (`127.0.0.1:5580`) directly to your active mount's transfer engine (`127.0.0.1:5572`), giving you instant access to real-time bandwidth metrics, upload queues, and VFS cache stats without authentication prompts.
>
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
> **Data Loss Risk**: Before running this command, verify that all files have finished uploading to the cloud. You can check active tasks in the Web GUI dashboard to confirm transfer queues are empty, or check Activity Monitor to ensure `rclone` network egress has dropped to zero.
>
> **Never clear this directory while uploads are in progress**, as files queued in the local buffer will be permanently erased before reaching the cloud, causing irrecoverable data loss or corrupted remote files.

To instantly wipe the local cache without affecting cloud files, delete the local cache and metadata folders:

```bash
rm -rf ~/Library/Caches/rclone/vfs*
```

### Safe Unmounting

Do not drag the mounted volume to the Trash. Unmount according to how the drive was launched:

- **If running via Launchctl background service (Section 4)**:
  Boot out the background services directly. This terminates Rclone cleanly and automatically unmounts the volume:

  ```bash
  launchctl bootout gui/$(id -u)/com.user.rclone.sharepoint 2>/dev/null
  launchctl bootout gui/$(id -u)/com.user.rclone.gui 2>/dev/null
  ```

- **If running manually via Terminal (Section 3)**:
  Unmount the mount point directly:

  ```bash
  diskutil unmount ~/SharePoint 2>/dev/null || umount ~/SharePoint
  ```

  *(If the mount point remains busy, force unmount with `diskutil unmount force ~/SharePoint`)*

### Inspecting and Truncating Logs

By default, Rclone runs at the `NOTICE` logging level, keeping log file growth negligible (typically under 1MB per year).

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

   In `rclone mount`, `--exclude` acts purely as a **read/visibility filter**, it hides files from Finder, but it does *not* intercept or block files written into the local VFS mount by macOS. Adding `--exclude "._*"` creates an illusion: Finder writes `._filename`, Rclone uploads it to SharePoint anyway, and then hides it from your local view so you cannot even see or delete it with normal `rm` commands.

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

4. **Purge Existing Companion Files from the Encrypted Vault**:

   To mass-delete any lingering `._*` and `.DS_Store` files from your cloud storage:

   ```bash
   /opt/local/bin/rclone delete sp-crypt: --include "._*" --include ".DS_Store"
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
4. **Permanent Immunity to SharePoint Property Promotion**:  
   SharePoint is an enterprise collaboration engine rather than transparent object storage. Normally, its parsers crack open Office documents (`.docx`, `.xlsx`, `.pptx`), PDFs, and markup files to inject tenant metadata and UUIDs—altering file sizes by a few hundred bytes and triggering endless Rclone upload loops (`corrupted on transfer: sizes differ`). Because `rclone crypt` encrypts all data and filenames into opaque ciphertext blobs before upload, SharePoint cannot parse, inspect, or modify any file. Bit-for-bit cryptographic integrity is 100% preserved.
5. **Zero-Knowledge Cloud Privacy**:  
   All files, directory structures, and filenames are encrypted client-side using XSalsa20 + Poly1305 (AES-256 equivalent). Microsoft, tenant administrators, or compromised cloud credentials can only see scrambled hashes, completely neutralizing cloud data-mining and file inspection.
6. **Elimination of Filename Character Restrictions**:  
   SharePoint strictly rejects characters like `" * : < > ? / \ |`, leading/trailing spaces, periods at the end of filenames, and reserved Windows names (`CON`, `PRN`, `AUX`). Because `rclone crypt` encrypts all filenames into standard alphanumeric hashes, every valid macOS filename is supported without errors.

However, to ensure optimal performance, keep this in mind:

1. **High Overhead on Thousands of Small Files**:  
   Uploading a single 10GB video requires one continuous stream that saturates available network bandwidth. In contrast, copying a directory containing 30,000 fragmented files (such as `node_modules` or unpacked game assets) requires tens of thousands of individual REST API calls to Microsoft Graph. This creates severe network round-trip latency and quickly triggers **HTTP 429 (Too Many Requests)** rate limiting from Microsoft.

### The Golden Rule: Large Files Directly, Small Files Zipped

- **Directly to Mount**: Movies, TV series, photo libraries, disc images (`.iso`, `.dmg`), virtual machine disks, and pre-packaged archives.
- **Zip First Locally**: Code repositories, game installation directories, emulator ROM collections, and folders containing thousands of small files or HTML manuals. Compress them into a single `.zip` or `.7z` file before moving them to the mount. This avoids API rate limiting, preserves byte-for-byte integrity, and guarantees maximum upload throughput.

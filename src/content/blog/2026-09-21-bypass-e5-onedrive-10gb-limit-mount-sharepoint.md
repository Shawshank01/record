---
title: "Bypass E5 OneDrive 10GB Limit: Mount SharePoint"
description: "Bypass Microsoft 365 Developer E5 10GB OneDrive limits and macOS sync bugs using a dual-mount SharePoint setup with Rclone and FUSE-T."
pubDate: 2026-09-21
updateDate: 2026-09-29
tags:
  - macOS
  - MacPorts
  - Rclone
  - FUSE-T
  - Microsoft E5
  - OneDrive
  - SharePoint
---

![jxl hint](/2026-09-21/sharepoint-storage.jxl)
[SharePoint Storage](https://admin.cloud.microsoft/?#/reportsUsage/SharePointStorage)

This guide resolves the 10GB personal OneDrive quota limitation on Microsoft 365 Developer E5 subscriptions by leveraging the 1.24TB tenant-wide SharePoint storage pool with a **Dual-Mount Architecture**:

- **`~/SharePoint` (Raw Mount)**: Dedicated to large video files and general media. Files remain unencrypted in the cloud so you can stream or download them anywhere (SharePoint web portal, OneDrive mobile app, Infuse or VLC on Apple TV) without requiring Rclone or decryption keys.
- **`~/SharePointVault` (Encrypted Overlay Mount)**: Dedicated to sensitive records, personal documents, and private backups. Uses client-side zero-knowledge encryption via **Rclone Crypt** to protect data from cloud inspection and eliminate SharePoint metadata alteration loops.

It completely bypasses native macOS OneDrive client issues, such as `fileproviderd` circular deadlocks and 0% progress freezes, delivering native virtual drives with automated space reclamation (on-demand caching) and transparent on-the-fly decryption.

---

## 0. Create a Communication Site in SharePoint

Before installing tools and configuring Rclone, you must create a dedicated **Communication site** in your Microsoft 365 tenant to host your files.

![jxl hint](/2026-09-21/communication-site-sharepoint.jxl)

### Why a Communication Site is Essential

Microsoft SharePoint treats Team sites and Communication sites fundamentally differently when it comes to document versioning:

- **Team Sites (Do Not Use)**: Team sites are tied to Microsoft 365 Groups and Microsoft Teams. Microsoft mandates document version history on Team sites, enforcing a strict minimum of 100 to 500 major versions that **cannot be disabled**. If you store large files (such as 20GB–50GB video files, disk images, or encrypted vault chunks) in a Team site, any minor file modification or re-upload causes SharePoint to duplicate the entire multi-gigabyte payload into version history, silently exhausting your 1.24TB tenant storage pool within days.
- **Communication Sites (Essential)**: Only standalone Communication sites allow administrators to set Document Version History to **"No versioning"** in the classic library settings. Disabling versioning ensures that overwriting or modifying a file consumes exactly the size of the current file with zero hidden storage bloat.

### Creating the Site

1. Sign in to your Microsoft 365 portal and navigate to SharePoint (`https://<tenant>.sharepoint.com/_layouts/15/sharepoint.aspx/build`).
2. Click **Site** in the top navigation bar.
3. Select **Communication site** (do *not* choose Team site).
4. Choose the **Blank** template, enter a site name (such as `Storage` or `Drive`), and finish the creation wizard.
5. In [Section 2](#2-configure-rclone-with-sharepoint-and-crypt), select this newly created Communication site when Rclone prompts you to bind your SharePoint remote.

> [!IMPORTANT]
> Once your Communication site is created, make sure to disable version history on its default document library before uploading large files. Follow the step-by-step instructions in [Preventing SharePoint Version Bloat (Critical)](#preventing-sharepoint-version-bloat-critical) in Section 5.

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

> [!WARNING]
> **Do Not Install Rclone via Homebrew for Mounting**:
> Homebrew's `rclone` formula explicitly disables the FUSE `mount` subcommand on macOS. Running `rclone mount` with a Homebrew build terminates immediately with `CRITICAL: Fatal error: failed to mount FUSE fs: rclone mount is not supported on MacOS when rclone is installed via Homebrew`. Always use MacPorts (`rclone +mount`) or the official standalone binary from [rclone.org](https://rclone.org/downloads/).

### Step 4: Bridge FUSE-T to Rclone (`libfuse.2.dylib` Symlink)

Rclone's FUSE integration layer on macOS (`cgofuse`) searches for several candidate library filenames at runtime (`libfuse.2.dylib`, `libosxfuse.2.dylib`, and `libfuse-t.dylib`). While modern Rclone builds include `libfuse-t.dylib` in their search candidates, creating this symlink ensures universal compatibility across all FUSE utilities and eliminates potential runtime lookup delays:

```bash
sudo ln -sf /usr/local/lib/libfuse-t.dylib /usr/local/lib/libfuse.2.dylib
```

> [!IMPORTANT]
> **Ignore MacPorts' `macfuse.fs` Post-Install Recommendation**:
> When compiling `rclone +mount`, MacPorts pulls its internal `macfuse` port as a build dependency to satisfy C compilation headers. Upon completion, MacPorts displays a note suggesting:
>
> *sudo ln -fsn /opt/local/Library/Filesystems/macfuse.fs /Library/Filesystems/macfuse.fs*
>
> **Do not run this command**. Linking `macfuse.fs` attempts to load the legacy macFUSE kernel extension (kext), which triggers macOS security alerts on Apple Silicon Macs requiring you to boot into Recovery Mode and lower security to "Reduced Security". Linking `libfuse-t.dylib` to `libfuse.2.dylib` ensures Rclone routes all calls purely through **FUSE-T** in user space (via FSKit or NFS), leaving your system on **Full Security** with zero kernel extensions or reboots required.

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
   - Rclone will list all SharePoint sites in your tenant. Enter the corresponding numerical index for the communication site created in [Section 0](#0-create-a-communication-site-in-sharepoint).
   - Select the document library by entering the numerical index.

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

   *This stores all encrypted blobs inside a dedicated `vault` folder in your SharePoint document library, leaving the rest of your SharePoint available for regular, unencrypted media files.*

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

### Step 1: Create the Local Mount Points

```bash
mkdir -p ~/SharePoint ~/SharePointVault
```

### Step 2: Execute the Mount Command

Run the following optimised mount command in the foreground to test connectivity and review terminal logs for the unencrypted media mount:

```bash
/opt/local/bin/rclone mount sp: ~/SharePoint \
  --vfs-cache-mode full \
  --vfs-cache-max-age 12h \
  --vfs-cache-max-size 50G \
  --vfs-cache-poll-interval 1m \
  --poll-interval 1m \
  --vfs-write-back 5s \
  --onedrive-chunk-size 125M \
  --buffer-size 64M \
  --volname "SharePoint"
```

*To test mounting the encrypted vault instead, substitute `sp:` with `sp-crypt:`, `~/SharePoint` with `~/SharePointVault`, and `--volname "SharePoint"` with `--volname "SharePointVault"`.*

> [!NOTE]
> Running in the foreground (without `--daemon`) lets you inspect real-time log output, verify connectivity, and confirm that the filesystem mounts properly. Once you have confirmed that the mount functions as expected, press `Ctrl + C` in Terminal to cleanly terminate the test run, then proceed to [Section 4](#4-configure-automated-startup-at-login-macos-launchctl) to set up persistent background startup for both drives.

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

> [!TIP]
> **Transparent Decryption & Universal Streaming Access**:
> In `~/SharePointVault`, Rclone decrypts files dynamically in RAM-presenting normal filenames and data with zero manual steps. In `~/SharePoint`, files are uploaded unencrypted, allowing you to stream or download large videos on any device (such as mobile phones, smart TVs, or web browsers) without needing Rclone or encryption keys.

### Exploring Remotes with Rclone Web (Optional)

The modern official web interface **[Rclone Web](https://github.com/rclone/rclone-web)** is bundled directly into latest Rclone releases. If you ever want to visually inspect your configured cloud remotes (`sp` and `sp-crypt`) or explore cloud files in a web browser without mounting:

```bash
rclone gui
```

- **Instant Browser Launch**: Automatically starts a temporary web GUI server and opens your default browser pre-authenticated.
- **On-Demand Inspection**: When you are finished exploring, press `Ctrl + C` in Terminal to terminate the web GUI.

---

## 4. Configure Automated Startup at Login (macOS Launchctl)

Use macOS's native `launchctl` service to maintain persistent, background mounting for both virtual drives upon system login.

> [!NOTE]
> **Why `launchctl` is the ideal service manager on macOS**:
> macOS `launchctl` manages both virtual drives as native user daemons. It monitors both processes silently, consumes minimal memory, and automatically relaunches a mount if an unexpected network disruption occurs.

### Step 1: Generate the LaunchAgent Configurations

#### 1. Unencrypted Media Mount Service (`com.user.rclone.sharepoint.plist`)

Run the following command to create the directory structure:

```bash
mkdir -p ~/SharePoint ~/SharePointVault
mkdir -p ~/Library/LaunchAgents
mkdir -p ~/.config/rclone
```

For the unencrypted media drive mount service:

```bash
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

#### 2. Encrypted Vault Mount Service (`com.user.rclone.sharepointvault.plist`)

Run the following command to create the encrypted zero-knowledge vault mount service:

```bash
cat << EOF > ~/Library/LaunchAgents/com.user.rclone.sharepointvault.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.user.rclone.sharepointvault</string>
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
        <string>$HOME/SharePointVault</string>
        <string>--vfs-cache-mode</string>
        <string>full</string>
        <string>--vfs-cache-max-age</string>
        <string>12h</string>
        <string>--vfs-cache-max-size</string>
        <string>30G</string>
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
        <string>SharePointVault</string>
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
    <string>$HOME/.config/rclone/sharepointvault-mount.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.config/rclone/sharepointvault-mount.log</string>
</dict>
</plist>
EOF
```

> [!IMPORTANT]
> **`PATH`**: Ensures auxiliary tools and user-space helper symlinks in `/usr/local/bin` can be resolved by background jobs.

### Step 2: Activate the Services

```bash
# Ensure both target mount points are clean and unmounted
diskutil unmount force ~/SharePoint 2>/dev/null || umount -f ~/SharePoint 2>/dev/null
diskutil unmount force ~/SharePointVault 2>/dev/null || umount -f ~/SharePointVault 2>/dev/null

# Bootstrap and start background services in the modern user GUI domain
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.user.rclone.sharepoint.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.user.rclone.sharepointvault.plist
```

Both the **SharePoint** and **SharePointVault** drives will now automatically mount in Finder upon every login.

> [!IMPORTANT]
> Because `~/SharePoint` mounts the root of your SharePoint document library, the `vault/` folder will appear inside `~/SharePoint` containing encrypted hashes.
> **Do not edit, rename, or write files directly into `~/SharePoint/vault`**. Always interact with your encrypted files through the dedicated `~/SharePointVault` mount point.

The **Dual-Mount Architecture**:

```text
Local Mac (Finder):
├── ~/SharePoint         ──(FUSE-T)──>  sp:        (Unencrypted: Videos, Media, Public files)
└── ~/SharePointVault    ──(FUSE-T)──>  sp-crypt:  (Encrypted: Private documents & backups)

Microsoft SharePoint (Cloud):
├── Videos/              (Plain unencrypted files — downloadable anywhere)
├── Documents/           (Plain unencrypted files)
└── vault/               (Encrypted ciphertext blobs — managed by sp-crypt)
```

> [!TIP]
> **If the drive icons do not appear on your Desktop or Finder sidebar**:
> FUSE-T mounts the drives as network filesystems (NFS). Ensure macOS allows displaying connected network volumes:
>
> 1. Open **Finder** → press `Cmd + ,` (**Settings** / **Preferences**).
> 2. Under the **General** tab, check **Connected servers**.
> 3. Under the **Sidebar** tab, ensure **Connected servers** is checked under **Locations**.
>
> *Alternatively, navigate to `~/SharePoint` and `~/SharePointVault` in Finder and drag both folders directly into your **Favorites** sidebar for one-click access.*

---

## 5. Maintenance and Operations

### Manually Free All Local Space Immediately

> [!WARNING]
> **Data Loss Risk**: Before running this command, verify that all files have finished uploading to the cloud. You can monitor log files (`tail -f ~/.config/rclone/sharepoint-mount.log`) to confirm transfer queues are empty, or check Activity Monitor to ensure `rclone` network egress has dropped to zero.
>
> **Never clear this directory while uploads are in progress**, as files queued in the local buffer will be permanently erased before reaching the cloud, causing irrecoverable data loss or corrupted remote files.

To instantly wipe the local cache without affecting cloud files, delete the local cache and metadata folders:

```bash
rm -rf ~/Library/Caches/rclone/vfs*
```

### Safe Unmounting

Do not drag the mounted volume to the Trash. Unmount according to how the drive was launched:

- **If running via Launchctl background service (Section 4)**:
  Boot out the background services directly. This terminates Rclone cleanly and automatically unmounts both volumes:

  ```bash
  launchctl bootout gui/$(id -u)/com.user.rclone.sharepoint 2>/dev/null
  launchctl bootout gui/$(id -u)/com.user.rclone.sharepointvault 2>/dev/null
  ```

- **If running manually via Terminal (Section 3)**:
  Unmount the mount points directly:

  ```bash
  diskutil unmount ~/SharePoint 2>/dev/null || umount ~/SharePoint
  diskutil unmount ~/SharePointVault 2>/dev/null || umount ~/SharePointVault
  ```

  *(If a mount point remains busy, force unmount with `diskutil unmount force ~/SharePoint` or `diskutil unmount force ~/SharePointVault`)*

### Inspecting and Truncating Logs

By default, Rclone runs at the `NOTICE` logging level, keeping log file growth negligible (typically under 1MB per year).

To view live log output in Terminal:

```bash
# View unencrypted media mount logs:
tail -f ~/.config/rclone/sharepoint-mount.log

# View encrypted vault mount logs:
tail -f ~/.config/rclone/sharepointvault-mount.log
```

If you ever wish to instantly truncate and free log file space without restarting the background service:

```bash
: > ~/.config/rclone/sharepoint-mount.log
: > ~/.config/rclone/sharepointvault-mount.log
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
     # Or to the encrypted vault:
     cp -X "filename.jpg" ~/SharePointVault/
     # For directories:
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

4. **Purge Existing Companion Files from Cloud Storage**:

   To mass-delete any lingering `._*` and `.DS_Store` files across both cloud spaces:

   ```bash
   # From unencrypted SharePoint storage:
   /opt/local/bin/rclone delete sp: --include "._*" --include ".DS_Store"

   # From encrypted vault:
   /opt/local/bin/rclone delete sp-crypt: --include "._*" --include ".DS_Store"
   ```

### Preventing SharePoint Version Bloat (Critical)

> [!WARNING]
> To prevent minor file modifications or metadata changes on large videos from consuming the 1.24TB pool through version history, adjust document versioning settings on your Communication site *(as noted in [Section 0](#0-create-a-communication-site-in-sharepoint), "No versioning" is only available on Communication sites)*:

1. Navigate to your Communication site document library in a web browser.
2. Click the gear icon (**Settings**) → **Library settings** → **More library settings** → **Versioning settings**.
3. Under **Document Version History**, select **No versioning** and click **OK** at the bottom.

![jxl hint](/2026-09-21/versioning-settings.jxl)

---

## 6. Architectural Trade-offs & Ideal Workflows

You've finally broken free from OneDrive's sickeningly broken behaviour of SharePoint on macOS, a disaster born from corporate politics between Apple and Microsoft. With this dual-mount architecture in place, here is what you've gained:

1. **Dual-Mount Flexibility & Universal Media Access**:
   By mounting the raw remote `sp:` to `~/SharePoint`, large video files and media collections remain unencrypted in the cloud. You can stream them seamlessly with byte-range requests and instant seeking on macOS (via players like IINA, Infuse, or VLC), but you can *also* download or play them when away from your Mac—using the SharePoint web interface, OneDrive mobile app, or smart TV players—without needing Rclone or encryption keys.
2. **Zero-Knowledge Privacy & Metadata Immunity in `~/SharePointVault`**:
   Sensitive personal records, credentials, and backups placed into `~/SharePointVault` are encrypted on the fly via `rclone crypt` (XSalsa20 + Poly1305). Because SharePoint only receives opaque ciphertext blobs, it cannot crack open Office documents or PDFs to inject tenant UUIDs (`sizes differ` loops), and cloud administrators or compromised credentials cannot inspect your files.
3. **Eliminating macOS Sync Deadlocks**:
   Bypasses Apple's `fileproviderd` architecture completely, eliminating circular upload freezes, 0% progress bugs, and high CPU lockups during large transfers.
4. **True Cloud Capacity**:
   Unlocks the tenant-wide SharePoint storage pool, bypassing Microsoft's strict 10GB personal OneDrive quota on Developer E5 accounts.
5. **Elimination of Filename Character Restrictions in the Vault**:
   SharePoint strictly rejects characters like `" * : < > ? / \ |`, leading/trailing spaces, and periods at the end of filenames. Inside `~/SharePointVault`, `rclone crypt` encrypts all filenames into standard alphanumeric hashes, ensuring every valid macOS filename is supported without errors.

However, to ensure optimal performance, keep this in mind:

1. **High Overhead on Thousands of Small Files**:
   Uploading a single 10GB video requires one continuous stream that saturates available network bandwidth. In contrast, copying a directory containing 30,000 fragmented files (such as `node_modules` or unpacked game assets) requires tens of thousands of individual REST API calls to Microsoft Graph. This creates severe network round-trip latency and quickly triggers **HTTP 429 (Too Many Requests)** rate limiting from Microsoft.

### The Golden Rule: Large Files Directly, Small Files Zipped

- **Directly to Mount (`~/SharePoint` or `~/SharePointVault`)**: Videos, TV series, photo libraries, disc images (`.iso`, `.dmg`), virtual machine disks, and pre-packaged archives.
- **Zip First Locally**: Code repositories, game installation directories, emulator ROM collections, and folders containing thousands of small files or HTML manuals. Compress them into a single `.zip` or `.7z` file before moving them to the mount. This avoids API rate limiting, preserves byte-for-byte integrity, and guarantees maximum upload throughput.

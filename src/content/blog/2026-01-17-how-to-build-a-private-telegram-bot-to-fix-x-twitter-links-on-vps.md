---
title: "Private Telegram Bot for X Link Previews"
description: "How to build, secure and deploy a private Telegram bot to automatically replace x.com links with fixupx.com for native Instant View support."
pubDate: 2026-01-17T18:00:00
updateDate: 2026-02-14
tags:
  - Privacy
  - GNU/Linux
  - Telegram
  - Bot
  - Python
  - VPS
  - X/Twitter
---

If you use Telegram and X a lot and often share X links in a Telegram group chat, you may have noticed that the X links cannot show as 'Instant View', a very convenient function natively supported by Telegram, unless you add a prefix such as 'fixup' before the X URL. If you hate yourself, you can manually add the prefix each time you share an X URL in the group chat. Alternatively, you can set up a Telegram bot with your VPS to add the prefix automatically. This blog contains a guide documenting the exact process followed to build, secure and deploy the private Telegram X-Link Fixer bot on a VPS.

**Private Telegram X-Link Fixer:** Automatically detect `x.com` or `twitter.com` links, replace them with `fixupx.com` for better previews, remove tracking parameters, and delete the original message to keep the chat clean.

---

## 1. Bot Creation and Configuration (@BotFather)

1. **Create Bot:** Search for `@BotFather` on Telegram and send `/newbot`. Follow the prompts to name your bot and obtain your **API Token**.
2. **Disable Privacy Mode:** This is crucial for the bot to "see" messages containing links in group chats without needing an explicit `@mention`:
   - Send `/setprivacy` to `@BotFather`.
   - Select your bot, then select **Disable**.
   - *Note: If the bot is already a member of a group, remove and re-add it for this change to take effect.*
3. **Permissions:** Add the bot to your target group chat and promote it to **Administrator**. Ensure it has the **Delete Messages** permission enabled so it can remove the raw link after posting the preview.

---

## 2. Prepare the VPS Environment

Log in to your VPS and set up a dedicated directory with a Python virtual environment to keep dependencies isolated from the system Python.

### Debian and Ubuntu Setup

1. **Update package lists and install `python3-venv`:**

   ```bash
   sudo apt update && sudo apt install python3-venv -y
   ```

2. **Install `pip` using the official bootstrap script:**

   ```bash
   curl -sS https://bootstrap.pypa.io/get-pip.py | python3 -
   ```

3. **Create project directory and virtual environment:**

   ```bash
   mkdir -p ~/mybot && cd ~/mybot
   python3 -m venv venv
   source venv/bin/activate
   ```

4. **Install the required library:**

   ```bash
   pip install python-telegram-bot
   ```

### Fedora and RHEL Setup

1. **Update system packages and install `python3-pip`:**

   ```bash
   sudo dnf update -y && sudo dnf install python3-pip -y
   ```

2. **Create project directory and virtual environment:**

   ```bash
   mkdir -p ~/mybot && cd ~/mybot
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install the required library:**

   ```bash
   pip install python-telegram-bot
   ```

---

## 3. The Bot Script (bot.py)

Create the script inside `~/mybot` using `nano bot.py`. **Update the configuration** with your bot token and authorized IDs.

You can use **@userinfobot** in Telegram to find your user ID, group ID, and channel ID. You may also use third-party Telegram clients to retrieve your ID (such as [Swiftgram](https://swiftgram.app/) for Apple platforms or [Forkgram](https://f-droid.org/en/packages/org.forkgram.messenger/) on Android).

```python
import re
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

# --- CONFIGURATION ---
TOKEN = "YOUR_BOT_TOKEN"
# Template user ID and group ID, replace with your own IDs
# Group and channel IDs must include the -100 prefix if retrieved from third-party Telegram clients
AUTHORIZED_IDS = [1234567890, -1001234567890]

# Match X/Twitter links (including fixupx.com) and capture query parameters separately
X_PATTERN = r'(https?://(?:www\.)?)(x\.com|twitter\.com|fixupx\.com)(/[^\s?]*)(\?[^\s]*)?'

async def auto_fix_and_clean(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Security: Ignore unauthorized chats
    if update.effective_chat.id not in AUTHORIZED_IDS:
        return

    # Extract text from message or media caption
    text = update.message.text or update.message.caption
    if not text:
        return

    # Check if text contains any X/Twitter-related link
    match = re.search(X_PATTERN, text)
    if match:
        protocol, domain, path, query_params = match.groups()
        
        # Only process if URL has tracking parameters OR is not using fixupx.com
        if query_params or domain != 'fixupx.com':
            # Replace domain with fixupx.com and remove tracking parameters
            fixed_text = re.sub(X_PATTERN, r'\1fixupx.com\3', text)
            user = update.message.from_user.first_name
            
            # 1. Send the fixed version
            await context.bot.send_message(
                chat_id=update.effective_chat.id,
                text=f"🛠 From {user}:\n{fixed_text}"
            )

            # 2. Delete original message
            try:
                await update.message.delete()
            except Exception as e:
                print(f"Delete failed (Check Admin permissions): {e}")

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(MessageHandler((filters.TEXT | filters.CAPTION) & (~filters.COMMAND), auto_fix_and_clean))
    print("Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
```

### Optional: Match Links Only at Start of Message

By default, the bot detects and fixes X/Twitter links anywhere inside a message. If you prefer the bot to **only** process links that appear at the beginning of a message, modify the regex pattern:

```python
# Default: matches links anywhere in the message and removes tracking parameters
X_PATTERN = r'(https?://(?:www\.)?)(x\.com|twitter\.com|fixupx\.com)(/[^\s?]*)(\?[^\s]*)?'

# Alternative: matches links only at the start of the message and removes tracking parameters
X_PATTERN = r'^(https?://(?:www\.)?)(x\.com|twitter\.com|fixupx\.com)(/[^\s?]*)(\?[^\s]*)?'
```

The `^` anchor ensures the pattern triggers only when the message begins with the URL, preventing casual references within longer sentences from being captured.

> [!NOTE]
> The bot handles all X-related URLs intelligently:
>
> - Converts `x.com` and `twitter.com` to `fixupx.com`
> - Strips tracking queries (such as `?s=46&t=xxx`) from all links, including existing `fixupx.com` shares
>
> **Examples:**
>
> - `https://x.com/user/status/123?s=46&t=abc` → `https://fixupx.com/user/status/123`
> - `https://fixupx.com/user/status/123?s=46&t=abc` → `https://fixupx.com/user/status/123`
> - `https://fixupx.com/user/status/123` → No action (already clean)

---

## 4. Deploy as a Systemd Background Service

To ensure the bot continues running after closing your SSH session and restarts on server reboots, configure a `systemd` unit.

### Service File Configuration

Create the service file using `sudo nano /etc/systemd/system/tgbot.service`:

```ini
[Unit]
Description=Telegram X-Link Fixer Bot
After=network.target

[Service]
User=linuxuser
Group=linuxuser
WorkingDirectory=/home/linuxuser/mybot
ExecStart=/home/linuxuser/mybot/venv/bin/python bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

> [!TIP]
> Replace `linuxuser` and `/home/linuxuser/mybot` with your actual Linux user and project directory path.

### Enable and Start the Service

Reload the systemd daemon, enable automatic startup on boot, and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tgbot
```

---

## 5. Troubleshooting and Monitoring

Use these standard `systemd` and `journalctl` commands to inspect and manage your running bot:

- **Check Service Status:**

  ```bash
  sudo systemctl status tgbot
  ```

- **View Live Logs in Real Time:**

  ```bash
  sudo journalctl -u tgbot.service -f
  ```

- **Restart After Script Changes:**

  ```bash
  sudo systemctl restart tgbot
  ```

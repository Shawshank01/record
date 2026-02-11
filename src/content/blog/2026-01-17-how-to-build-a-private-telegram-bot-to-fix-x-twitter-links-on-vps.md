---
title: "Private Telegram X-Link Fixer: A Step-by-Step Guide to Enhancing Link Previews"
description: "How to build, secure and deploy a private Telegram bot to automatically replace x.com links with fixupx.com for native Instant View support."
pubDate: 2026-01-17T18:00:00
updateDate: 2026-02-11
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

---

## 🛠 Private Telegram X-Link Fixer

**Goal:** Automatically detect `x.com` or `twitter.com` links, replace them with `fixupx.com` for better previews, remove tracking parameters, and delete the original message to keep the chat clean.

---

### 1. Bot Creation & Configuration (@BotFather)

1. **Create Bot:** Search for `@BotFather` on Telegram and send `/newbot`. Follow the steps to get your **API Token**.
2. **Disable Privacy Mode:** This is crucial for the bot to "see" links without being tagged.
   - Send `/setprivacy` to @BotFather.
   - Select your bot, press **Disable** button.
   - *PS: If the bot was already in a group, remove and re-add it for this to take effect.*

3. **Permissions:** Add the bot to your group and promote it to **Administrator**. Ensure it has the **"Delete Messages"** permission.

---

### 2. Prepare the VPS Environment

Login to your VPS and set up a dedicated directory with a Python virtual environment to keep things isolated.

**For Debian/Ubuntu systems:**

**Step 1: Update package list and install Python venv**
```bash
sudo apt update && sudo apt install python3-venv -y
```

**Step 2: Install pip using the official method**
```bash
curl -sS https://bootstrap.pypa.io/get-pip.py | python3 -
```

**Step 3: Navigate to home directory and create project folder**
```bash
cd ~
mkdir mybot && cd mybot
```

**Step 4: Create and activate virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Step 5: Install the required library**
```bash
pip install python-telegram-bot
```

**For Fedora/RHEL-based systems:**

**Step 1: Update system and install Python pip**
```bash
sudo dnf update -y && sudo dnf install python3-pip -y
```

**Step 2: Navigate to home directory and create project folder**
```bash
cd ~
mkdir mybot && cd mybot
```

**Step 3: Create and activate virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Step 4: Install the required library**
```bash
pip install python-telegram-bot
```

---

### 3. The Bot Script (`bot.py`)

Create the script using `nano bot.py`. **Update the IDs** with your specific User/Group IDs.

You can use **@userinfobot** in Telegram to find your user ID, group ID, and channel ID. You may also use third-party Telegram clients to retrieve your ID. I personally recommend [Swiftgram](https://swiftgram.app/) for Apple users and [Forkgram](https://f-droid.org/en/packages/org.forkgram.messenger/) for Android users.

```python
import re
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

# --- CONFIGURATION ---
TOKEN = "YOUR_BOT_TOKEN"
# Template user ID and group ID, replace with your own IDs
# Group and channel IDs must include the -100 prefix if you get it from third-party Telegram clients
AUTHORIZED_IDS = [1234567890, -1001234567890]

# Match X/Twitter links (including fixupx.com) and capture query parameters separately
X_PATTERN = r'(https?://(?:www\.)?)(x\.com|twitter\.com|fixupx\.com)(/[^\s?]*)(\?[^\s]*)?'

async def auto_fix_and_clean(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Security: Ignore unauthorized chats
    if update.effective_chat.id not in AUTHORIZED_IDS:
        return

    # Extract text from message or media caption
    text = update.message.text or update.message.caption
    if not text: return

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

#### Optional: Match Links Only at the Start of Messages

By default, the bot will detect and fix X/Twitter links anywhere in a message. If you prefer the bot to **only** process links that appear at the very beginning of a message, modify the `X_PATTERN`:

```python
# Default: matches links anywhere in the message and removes tracking parameters
X_PATTERN = r'(https?://(?:www\.)?)(x\.com|twitter\.com|fixupx\.com)(/[^\s?]*)(\?[^\s]*)?'

# Alternative: matches links only at the start of the message and removes tracking parameters
X_PATTERN = r'^(https?://(?:www\.)?)(x\.com|twitter\.com|fixupx\.com)(/[^\s?]*)(\?[^\s]*)?'
```

The `^` anchor ensures the pattern only triggers when the link is at the start of the message. This is useful if you want to allow regular X links in conversation while only fixing "intentional" shares that start with the link.

> [!UPDATE]  
> The bot now intelligently handles all X-related URLs:
> - Converts `x.com` and `twitter.com` to `fixupx.com`
> - Removes tracking parameters (like `?s=46&t=xxx`) from **all** URLs, including those already using `fixupx.com`
>
> **Examples:**
> - `https://x.com/user/status/123?s=46&t=abc` → `https://fixupx.com/user/status/123`
> - `https://fixupx.com/user/status/123?s=46&t=abc` → `https://fixupx.com/user/status/123`
> - `https://fixupx.com/user/status/123` → No action (already clean)

---

### 4. Deploy as a Background Service

To ensure the bot stays running after you close your terminal or if the server reboots, create a `systemd` service.

**Create the file:**
`sudo nano /etc/systemd/system/tgbot.service`

**Paste this configuration** (Ensure the paths match your `which python` output):

```ini
[Unit]
Description=Telegram X-Link Fixer Bot
After=network.target

[Service]
User=linuxuser
Group=linuxuser
WorkingDirectory=/home/linuxuser/mybot #replace with your own path
ExecStart=/home/linuxuser/mybot/venv/bin/python bot.py #replace with your own path
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and Start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable tgbot
sudo systemctl start tgbot
```

---

Now you can enjoy the convenient bot with your friends in group chats!

---

### Troubleshooting Commands

**Check status:**
```bash
sudo systemctl status tgbot
```

**View live logs:**
```bash
sudo journalctl -u tgbot.service -f
```

**Restart after code change:**
```bash
sudo systemctl restart tgbot
```

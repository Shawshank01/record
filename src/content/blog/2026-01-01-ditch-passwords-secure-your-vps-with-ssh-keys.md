---
title: "Ditch Passwords: Secure Your VPS with SSH Keys (RackNerd Ubuntu)"
description: "We move beyond complex passwords and harden SSH access using ed25519 keys, proper permissions, and cloud-init overrides."
pubDate: 2026-01-01
tags:
  - IT
  - Linux
  - Ubuntu
  - VPS
  - RackNerd
---

Last time we covered how to enhance VPS security by creating regular users and changing passwords to more complex ones. Here's an image for reference:

![How safe is your password](/how-safe-is-your-password.jpeg)

But is a password the most secure option? Not necessarily. Because even if your password is long and complex, password-based SSH logins still suffer from a few fundamental problems:

- **They can be brute-forced** (even if it’s unlikely, attackers will try constantly).
- **They rely on something you type**, which means they can be phished, logged, or reused.
- **They expand the attack surface**, you’re leaving a whole authentication method enabled on the server.

The better approach is:  
🔐 **Use SSH keys** and disable password logins completely.

This article documents the full journey: generating a strong key pair on macOS (or on whatever system you want), installing the key correctly on the server, fixing permission issues, and (most importantly) handling the tricky part, **cloud-init overriding your SSH config**.

---

## Why SSH Keys are Better than Passwords

SSH keys are essentially cryptographic credentials. Instead of “something you know” (password), SSH keys rely on:

- a **private key** (kept on your machine)
- a **public key** (stored on your server)
- optional **passphrase** protection for the private key

### Benefits

- **Extremely resistant to brute force**
- **No password guessing over the network**
- **You can lock down access** to key-only authentication
- You can manage multiple keys and revoke them cleanly

---

## Step 1: Generate an ed25519 SSH Key

We used this command:

```bash
ssh-keygen -t ed25519 -a 100
```

### What does `-a 100` mean?

`-a` controls the number of key derivation rounds used to protect your private key when you set a passphrase.

More rounds = harder to brute-force the passphrase if your private key is stolen.

### Where does the key go?

On macOS, if you press Enter when asked for a file path, the key will be stored in:

- `~/.ssh/id_ed25519` (private key)
- `~/.ssh/id_ed25519.pub` (public key)

You can use `-f` to specify a file path.

---

## Step 2: Should You Use a Passphrase?

During the generation process, you will be asked if you want to set up a passphrase for your key. In most situations, the answer is

**Yes.** Highly recommended.

If your laptop is compromised and your private key is stolen:

- without passphrase: attacker gets instant access
- with passphrase: attacker must brute-force it offline (very expensive)

If convenience is a concern, macOS can store the passphrase via Keychain so you don’t type it every time.

For the simplest way, you can also leave it empty.

---

## Step 3: Put the Public Key on the VPS (Correct Location)

This is where many people get confused (including me).

### Important concept

Your public key file name on your Mac can be anything, like `id_ed25519.pub`.

But on a Ubuntu VPS, SSH expects keys to be listed inside:

```bash
~/.ssh/authorized_keys
```

That means for user `ubuntu`, the path is:

```bash
/home/ubuntu/.ssh/authorized_keys
```

Use this if there's no `.ssh/` folder
```bash
mkdir -p ~/.ssh
```

Simply placing the `id_ed25519.pub` file in the `.ssh/` folder will not work.

According to the [official documentation](https://help.ubuntu.com/community/SSH/OpenSSH/Keys),

### Option A (recommended): `ssh-copy-id`

```bash
ssh-copy-id ubuntu@your-vps
```

### Option B: manual copy

On your local machine:

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the output, then on the VPS:

```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
```

Paste the key on a new line.

---

## Step 4: Fix Permissions (Why `chmod 700` and `chmod 600`?)

SSH is strict about file permissions for good reason.

If `.ssh` or `authorized_keys` is accessible or writable by others, SSH assumes it could be tampered with and may ignore it.

Run these on the VPS:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chown -R $USER:$USER ~/.ssh
```

✅ If above cmd show no output: that’s normal. Silent success is expected.

To verify:

```bash
ls -ld ~/.ssh
ls -l ~/.ssh/authorized_keys
```

Expected:

```text
drwx------ 2 ubuntu ubuntu ... .ssh
-rw------- 1 ubuntu ubuntu ... authorized_keys
```

---

## Step 5: Confirm Key Login Works First

Before disabling passwords, **always test key login in a new terminal**:

```bash
ssh ubuntu@your-vps
```

If it logs in without asking for the VPS password (it may ask your key passphrase), you're ready.

Keep your current SSH session open during testing so you don’t lock yourself out.

---

## Step 6: Disable Password Login (And It Didn’t Work at First)

After edited `/etc/ssh/sshd_config` and added:

```text
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
KbdInteractiveAuthentication no
```

I restarted SSH and even restarted `ssh.socket`.

But password login still worked.

### The truth came from

```bash
sudo sshd -T | grep passwordauthentication
```

It showed:

```text
passwordauthentication yes
```

Even though my config file clearly said `no`.

So what happened?

---

## The Real Issue: RackNerd `50-cloud-init.conf` Overriding Your Config

On RackNerd Ubuntu VPS templates, the SSH config often includes:

```text
Include /etc/ssh/sshd_config.d/*.conf
```

And inside that folder I found:

```bash
/etc/ssh/sshd_config.d/50-cloud-init.conf
```

That file had:

```text
PasswordAuthentication yes
```

So even though I set it to `no` in the main config, **cloud-init config loaded later and overrode it**.

✅ Fix: change it to:

```text
PasswordAuthentication no
```

Then restart:

```bash
sudo systemctl restart ssh
sudo systemctl restart ssh.socket
```

After that, password login stopped working.

---

## Step 7: Make It Future-Proof (Recommended)

Cloud-init can regenerate files in the future, depending on setup.

A safer approach is to create a final override file that loads last:

```bash
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf >/dev/null <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
EOF
```

Then:

```bash
sudo sshd -t
sudo systemctl restart ssh
sudo systemctl restart ssh.socket
```

Now even if cloud-init modifies `50-cloud-init.conf`, the final hardening file will win.

---

## Step 8: Verify Password Login Is Truly Disabled

On the VPS, check:

```bash
sudo sshd -T | egrep 'passwordauthentication|permitrootlogin|pubkeyauthentication|kbdinteractiveauthentication'
```

Expected output includes:

```text
passwordauthentication no
permitrootlogin no
pubkeyauthentication yes
kbdinteractiveauthentication no
```

---

## Bonus Hardening (Optional but Recommended)

### Install fail2ban

It reduces brute-force noise and bans abusive IPs automatically.

```bash
sudo apt update
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

### Disable X11 forwarding if you don’t need it

In sshd_config:

```text
X11Forwarding no
```

Less attack surface.

---

## Summary: What We Achieved

By the end of this journey, our VPS is significantly more secure:

✅ Root SSH login disabled  
✅ Root password locked  
✅ SSH keys enabled  
✅ Password authentication disabled  
✅ cloud-init overrides handled properly  
✅ permissions correctly locked down  

In short: attackers can no longer brute-force their way into your VPS via passwords.

---

## Next Time

Now that SSH access is hardened, we can move on to:

- firewall setup (ufw)
- automatic security upgrades
- monitoring login attempts
- restricting SSH access by IP or using VPN
- adding 2FA or using tools like **Proton Authenticator** for sudo

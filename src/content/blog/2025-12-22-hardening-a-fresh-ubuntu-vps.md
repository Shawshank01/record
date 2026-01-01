---
title: "Hardening a Fresh Ubuntu VPS: From Root Login to Secure SSH"
description: "A step-by-step guide to securing a new Ubuntu VPS by creating a regular user, configuring sudo, and disabling root SSH access."
pubDate: 2025-12-22
tags:
  - IT
  - Linux
  - Ubuntu
  - VPS
---

## Introduction

Nowadays, many cloud service providers offer VPS instances that allow direct SSH access as the root user by default. While convenient for initial setup, this configuration increases the attack surface and deviates from security best practices. This blog walks through hardening a fresh VPS step by step, from creating a regular user account to disabling root SSH login.

The examples below assume:
- Ubuntu as the operating system
- You initially log in as `root`
- SSH access is already available

---

## Why Direct Root SSH Login Is a Problem

Allowing direct root login over SSH has several downsides:

- **Larger attack surface**: attackers know the username (`root`) in advance
- **No accountability**: all actions appear as root, with no user separation
- **Higher risk**: a single compromised password or key grants full system control

Best practice is to:
1. Use a regular user for daily operations
2. Escalate privileges only when needed via `sudo`
3. Disable root SSH access entirely

---

## Step 1: Inspect Existing Users

On a fresh VPS, for instance, from RackNerd, you’ll often find that only `root` is a real login user.

```bash
cat /etc/passwd
```

If you see only system accounts (with shells like `/usr/sbin/nologin`) and `root`, you’ll need to create a regular user.

---

## Step 2: Create a Regular User

Create a new user (we’ll call it `ubuntu` this time, you can change it to whatever name you like):

```bash
adduser ubuntu
```

This command:
- Creates a home directory (`/home/ubuntu`)
- Assigns a normal UID (≥ 1000)
- Sets `/bin/bash` as the login shell
- Prompts you to set a password

If you prefer to use a strong, randomly generated password instead of choosing one manually, you can generate it locally with OpenSSL:

```bash
openssl rand -base64 32
```

Copy the generated password and paste it when prompted by `adduser`, or set it afterward using:

```bash
passwd ubuntu
```

---

## Step 3: Grant Sudo Privileges

To allow administrative tasks without logging in as root:

```bash
usermod -aG sudo ubuntu
```

Test it:

```bash
su - ubuntu
sudo whoami
```

Expected output:

```text
root
```

---

## Step 4: Verify SSH Access for the New User

Before making any SSH changes, **always test**:

```bash
ssh ubuntu@localhost
```

If this works locally, remote SSH access will work as well.

---

## Step 5: Disable Root SSH Login

Once you’ve confirmed the new user can log in and use sudo, disable root SSH access.

Edit the SSH configuration:

```bash
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
```

Restart SSH:

```bash
systemctl restart ssh
```

Verify:

```bash
sshd -T | grep permitrootlogin
```

Expected:

```text
permitrootlogin no
```

---

## Step 6 (Optional but Recommended): Lock the Root Password

To prevent *any* password-based root login:

```bash
passwd -l root
```

Root access remains available via `sudo`.

Verify the root account is locked:

```bash
passwd -S root
```

Expected output:

```text
root L ...
```

---

## Step 7 (Optional): Passwordless sudo for Convenience

If you want `sudo -i` to switch to root without prompting for a password:

```bash
sudo visudo
```

Add:

```text
ubuntu ALL=(ALL) NOPASSWD:ALL
```

Now:

```bash
sudo -i
```

drops you directly into a root shell.

> ⚠️ Note: This trades convenience for security. Use with care.

---

## Final Checklist

- ✅ Regular user created
- ✅ Sudo configured
- ✅ SSH access verified
- ✅ Root SSH login disabled
- ✅ Root password locked (optional)

---

## Future Improvements

The steps covered in this post establish a secure baseline for a freshly provisioned VPS. However, there is still room for further hardening.

One of the most impactful improvements is switching from password-based SSH authentication to **SSH key–based authentication**. SSH keys provide:

- Stronger cryptographic security
- Protection against brute-force password attacks
- Better usability once configured

Use SSH key will significantly reduce the attack surface of an internet-facing server.

In someday, perhaps we can walk through the process of configuring SSH keys step by step and locking down SSH access even further.

But until then, I wish you a Merry Christmas 🎄✨🎅

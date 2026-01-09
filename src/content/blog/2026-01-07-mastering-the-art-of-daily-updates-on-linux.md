---
title: "Mastering the Art of Daily Updates on Linux (and macOS)"
description: "Satisfying the compulsion for daily system updates with a custom bash script for Linux and Docker."
pubDate: 2026-01-07
updatedDate: 2026-01-09
tags:
  - Bash
  - Linux
  - Docker
  - macOS
---

There are two types of people: those who never update their software and those who do it every day.

Clearly, I'm the latter. I even perform various update operations daily across different devices: from system-level to application-level. And whenever I'm unsure what to do, “updating” is absolutely my default unconscious choice. I'm so addicted to updating that I wonder if it's some kind of disease such as compulsive disorder. Perhaps medical or psychological experts have already conducted similar research on this?

Anyway, while updating functions on popular operating systems like iOS, macOS, Android, and Windows has become remarkably straightforward and user-friendly, the process remains less intuitive for Linux systems, particularly when using the command-line interface (CLI). Although users can leverage unattended-upgrades for automated updates, this solution doesn't address all challenges for heavy Docker users.

That's why I need to write an update script to satisfy my perverted desire to update.

## The Script

Here is the `up.sh` script that handles system and Docker updates:

```bash
#!/bin/bash

# Ensure the script exits if any command fails
set -e

echo "--- Starting System Update ---"
sudo apt-get update
sudo apt-get full-upgrade -y
sudo apt-get autoremove -y

echo "--- Updating Docker Containers via Watchtower ---"
sudo docker run --rm \
    # Note: Docker API version is essential for Watchtower to function correctly
    -e DOCKER_API_VERSION=1.44 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    containrrr/watchtower \
    --run-once \
    --cleanup \
    your container names (separate by space)

echo "--- Cleaning up unused Docker resources ---"
sudo docker container prune -f
# Removed -a to keep cached images or keep it for deep clean
sudo docker image prune -a -f
sudo docker volume prune -f
sudo docker network prune -f
sudo docker builder prune -f

echo "Update complete!"
```

## Installation and Usage

1. Create the script file:

```bash
sudo nano /usr/local/bin/up.sh
```

2. Paste the content above into the file and save it.

3. Make the script executable:

```bash
sudo chmod +x /usr/local/bin/up.sh
```

4. Run the script from anywhere in the terminal:

```bash
up.sh
```

## Bonus: Daily Updates on macOS (Homebrew)

If you are on macOS and want to satisfy your update craving with Homebrew, this single command is all you need for aggressive maintenance:

```bash
brew upgrade && brew autoremove && brew cleanup --prune=all
```

- **brew upgrade**: Upgrades all packages.
- **brew autoremove**: Removes orphan dependencies that are no longer needed.
- **brew cleanup --prune=all**: Aggressively clears the cache to free up maximum disk space (I recommend using it with the 256 GB SSD MacBook Air).

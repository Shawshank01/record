---
title: "yt-dlp: The Ultimate Command-Line Video Downloader with Open-Source GUI"
description: "How to use yt-dlp to download videos from YouTube and thousands of other sites, with a simple and lightweight graphical user interface."
pubDate: 2026-03-17
tags:
  - yt-dlp
  - FFmpeg
  - macOS
  - Linux
  - Electron
  - GUI
  - CLI
---

In [this previous blog](https://zaku.eu.org/blog/2026-02-19-ffmpeg-the-ultimate-cross-platform-video-tool/), I introduced you to FFmpeg, and now I'm going to introduce you to another excellent open-source tool: [yt-dlp](https://github.com/yt-dlp/yt-dlp).

> yt-dlp is a feature-rich command-line audio/video downloader with support for thousands of sites.

You can use it for all sorts of things, but the feature you’ll probably use most often is downloading videos or audio from YouTube to your archive, given the crazy censorship on YouTube these days. If you want to save a video that disappears within a few hours of being uploaded, give yt-dlp a go!

---

### Installation

First, install it using Homebrew:

```bash
brew install yt-dlp
```

### Common Commands

Here are some commands I usually use:

**Download the best quality available (Standard):**
```bash
yt-dlp --cookies-from-browser brave 'URL'
```

**List all available formats for a video:**
```bash
yt-dlp -F --cookies-from-browser brave 'URL'
```

**Download a specific format (e.g., format 299+140):**
```bash
yt-dlp -f 299+140 --cookies-from-browser brave 'URL'
```

**Download all available subtitles without downloading the video:**
```bash
yt-dlp --write-subs --all-subs --skip-download 'URL'
```

**Download and merge into an MP4 container (FFmpeg is required):**
```bash
yt-dlp --merge-output-format mp4 --cookies-from-browser brave 'URL'
```

> **💡 Tips**
> 
> 1. To download videos from YouTube, it is better to use your browser's cookies (e.g., Brave, Firefox, or Chrome) to increase the success rate; using `--cookies-from-browser brave` allows `yt-dlp` to bypass bot detection and access age-restricted content by using your browser's session. However, this is usually not necessary for other platforms like X or Vimeo.
> 2. If you want to use Safari's cookies, you need to give `yt-dlp` permission to access your Safari cookies in the system settings first.

---
(TO BE CONTINUED)

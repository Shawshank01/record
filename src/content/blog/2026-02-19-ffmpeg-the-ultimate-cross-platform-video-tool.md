---
title: "FFmpeg: The Ultimate Cross-Platform Video Tool"
description: "Why FFmpeg is my daily driver for video/audio processing and a collection of useful commands."
pubDate: 2026-02-19
updateDate: 2026-02-28
tags:
  - FFmpeg
  - macOS
  - Video
  - Audio
  - Freedom Software
  - CLI
---

I've always maintained that only cross-platform software merits long-term commitment. Final Cut Pro is indeed formidable, and Adobe's suite is undeniably capable, but neither runs natively on every operating system. Once you've grown accustomed to them, you've effectively tied yourself to the systems they run on. Departing from a particular platform means abandoning these familiar tools, significantly increasing your sunk costs.

But fear not — [FFmpeg](https://ffmpeg.org/) covers your ass.

I started using it by processing some simple tasks, such as trimming the duration of video or audio clips, extracting segments, merging multiple clips, changing the format of videos (e.g. .mkv to .mp4) to make them more compatible with different devices, re-encoding video and audio (e.g. h264 to hevc or webm to aac), compressing videos, changing their resolution and burning subtitles into videos.

These tasks are a daily driver for me at certain times, but they are not worth processing by launching a large app like Final Cut Pro. After some time of learning and hands-on practice, I've compiled a list of frequently used commands for reference.

---

### 1. Basic Trimming
Trimming a video without re-encoding is extremely fast as it simply copies the data.

**Trim the first 10 minutes:**
```bash
ffmpeg -t 10:00 -i input.mp4 -c copy output.mp4
```

**Extract a 10-minute segment starting from 10:00:**
```bash
ffmpeg -ss 10:00 -t 10:00 -i input.mp4 -c copy output.mp4
```

**Keep everything from 20 minutes onwards:**
```bash
ffmpeg -ss 20:00 -i input.mp4 -c copy output.mp4
```

*Tip: If you want to change the minutes or seconds, simply adjust the numbers in the command. However, if the time exceeds 1 hour, use the format `HH:MM:SS` (e.g., `1:10:00` instead of `70:00`).*

---

### 2. Merging and Concatenation
If you have multiple clips with the same parameters (resolution, codec, etc.), you can merge them using the concat demuxer.

**Merge clips listed in `merge.txt`:**
```bash
ffmpeg -f concat -safe 0 -i merge.txt -c copy output.mp4
```
*Tip: `merge.txt` should contain lines like **file 'input.mp4'**. You can download a template by clicking <a href="/merge.txt" download>Here</a>.*

---

### 3. Encoding for Compatibility
Sometimes you need to ensure a video plays everywhere by using standard H.264 settings.

**High-quality H.264 re-encode for storage:**
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 18 -preset veryslow -c:a copy -tag:v avc1 output.mp4
```
*Tip: Use this one carefully, cause this only use the CPU to do the heavy encoder work since the `-crf 18` and `-preset veryslow` is consider as the high quality video close to lossless. You can lower the video quality by using `-crf 23` with `-preset medium` and have an output significantly faster.*

---

### 4. Burning Subtitles (Hardsubs)
Burning subtitles directly into the video stream ensures they show up on any player.

**Basic subtitle burn-in:**
```bash
ffmpeg -i input.mp4 -vf "subtitles=subtitle.srt" output.mp4
```
*Tip: When declaring filters, it is better to quote the entire filter string, i.e., `-vf "subtitles=subtitle.srt"` rather than `-vf subtitles="subtitle.srt"`. This ensures the shell correctly passes the entire string as a single argument to the `-vf` option.*

**Burn subtitles with spaces in the filename (Best Practice):**
```bash
ffmpeg -i input.mkv -vf "subtitles='my subtitles.srt'" output.mkv
```
*Tip: If your subtitle filename has spaces or special characters, nest single quotes inside the double quotes holding the filter.*

**Burn VTT subtitles with a specific font (Songti SC):**
```bash
ffmpeg -i input.mp4 -vf "subtitles=subtitle.vtt:force_style='FontName=Songti SC'" -c:v libx264 -crf 18 -preset veryslow -c:a libfdk_aac -tag:v avc1 output.mp4
```
*Tip: FFmpeg's `subtitles` filter also fully supports `.srt` and `.ass` formats. While `.vtt` and `.srt` may require `force_style` to look good, `.ass` files (Advanced SubStation Alpha) can contain their own rich styling, colors, and positioning data which FFmpeg will render perfectly out of the box.*

---

### 5. Format Conversion and Optimization
Converting between formats like WebM to MP4 or using modern codecs like HEVC (H.265).

**Compress a video to 720p MP4 (H.264) with audio re-encoding:**
```bash
ffmpeg -i input.mp4 -vf scale=1280:720 -c:v h264 -crf 23 -preset slow -c:a libfdk_aac -tag:v avc1 output.mp4
```

**Compress a video to 10-bit 1080p MP4 (H.265) with original audio codec:**
```bash
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:v hevc -crf 28 -preset slow -pix_fmt yuv420p10le -c:a copy -tag:v hvc1 output.mp4
```
*Tip: If you use `-vf scale=1280:-1`, FFmpeg will fix the width at 1280 and automatically calculate the height to ensure the video isn't stretched. Above cmds will force the dimensions even if it makes everyone look thin or fat.*

---

### 6. macOS Hardware Acceleration (VideoToolbox)
If you're on a Mac, using `videotoolbox` will significantly speed up the encoding process and save battery.

| ⚠️ GPU Compatibility Warning |
| :--- |
| Hardware acceleration is highly dependent on your GPU's capabilities. If your Mac's GPU doesn't support a specific coding format — such as the modern **AV1** format on older models — using `-hwaccel videotoolbox` will result in an error. If you are not sure about your GPU's capabilities, you can just use the same cmds below without `-hwaccel videotoolbox` to achieve a quick encoding. |

**Fast H.264 and libfdk_aac re-encoding:**
```bash
ffmpeg -hwaccel videotoolbox -i input.webm -c:v h264_videotoolbox -b:v 5000k -c:a libfdk_aac -vbr 5 -tag:v avc1 output.mp4
```

**Fast 10-bit HEVC (H.265) and libfdk_aac re-encoding:**
```bash
ffmpeg -hwaccel videotoolbox -i input.webm -c:v hevc_videotoolbox -b:v 3000k -pix_fmt p010le -c:a libfdk_aac -vbr 5 -tag:v hvc1 output.mp4
```

**HEVC and aac_at (Apple's AAC encoder audio codec) with Burned Subtitles:**
```bash
ffmpeg -hwaccel videotoolbox -i input.webm -vf subtitles=subtitle.vtt -c:v hevc_videotoolbox -b:v 2500k -pix_fmt p010le -c:a aac_at -q:a 5 -tag:v hvc1 output.mp4
```

**H.264 with Burned Subtitles (Custom Font for Chinese):**
```bash
ffmpeg -hwaccel videotoolbox -i input.webm -vf "subtitles=subtitle.vtt:force_style='FontName=Songti SC'" -c:v h264_videotoolbox -b:v 4000k -c:a aac_at -q:a 5 -tag:v avc1 output.mp4
```

**HEVC with Burned Subtitles (Custom Font for Chinese):**
```bash
ffmpeg -hwaccel videotoolbox -i input.webm -vf "subtitles=subtitle.vtt:force_style='FontName=Songti SC'" -c:v hevc_videotoolbox -pix_fmt p010le -b:v 2500k -c:a aac_at -q:a 5 -tag:v hvc1 output.mp4
```

---

### 7. Audio Extraction
Extracting high-quality audio from video files.

**Extract audio to M4A without re-encoding (Fastest, Original Quality):**
```bash
ffmpeg -i input.mp4 -vn -c:a copy output.m4a
```

**Extract audio to M4A using `libfdk_aac` re-encoding (Options Required, 0 - 5, 5 is the highest):**
```bash
ffmpeg -i input.mp4 -vn -c:a libfdk_aac -vbr 5 output.m4a
```

**Extract audio to M4A using `aac_at` re-encoding (macOS Native, 0 - 14, 0 is the highest):**
```bash
ffmpeg -i input.mp4 -vn -c:a aac_at -q:a 5 output.m4a
```

---

### Ignore this Part if You are NOT a macOS User
If you find that some of these commands fit your requirements, or if you're interested in exploring more of the fun that FFmpeg has to offer and are ready to install it on your device, I also have some advice for you if you’re a macOS user.

The first and most important thing to note is that if you use Homebrew to install it, you might want to change a little bit of your initial process. According to the [official document](https://trac.ffmpeg.org/wiki/CompilationGuide/macOS#Additionaloptions), which I quote:

> Since v2.0, Homebrew does not offer options for its core formulae anymore. Users who want to build ffmpeg with additional libraries (including non-free ones) need to use so-called taps from third party repositories. These repositories are not maintained by Homebrew.

This means that if you want to use options such as the Fraunhofer FDK AAC library (`libfdk_aac`), which does not come directly from the default FFmpeg bundle, that allows you to re-encode the audio to improve the quality instead of using the default AAC encoder from FFmpeg, then you need to install this repository [homebrew-ffmpeg/homebrew-ffmpeg](https://github.com/homebrew-ffmpeg/homebrew-ffmpeg) with cmd below:

```bash
brew tap homebrew-ffmpeg/ffmpeg
brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-<option1> --with-<option2> ...
```

### Troubleshooting

While this increases flexibility, it also comes with a price. After using it for a while, you may notice that the FFmpeg command breaks from time to time, especially after running the `brew upgrade`. That is because when use the homebrew-ffmpeg tap, Homebrew usually compiles the program from source code specifically for the Mac. During this process, a tool called a linker runs. If the Homebrew only updates the specific library and changes its path that FFmpeg relies on, it will break FFmpeg. However, it's easy to fix. You can simply reinstall FFmpeg by running the command below:

```bash
brew reinstall homebrew-ffmpeg/ffmpeg/ffmpeg
```

This will fix most of the errors you might have encountered and also keep your options as they were when you first installed it.

---

<div class="text-center py-16 px-4 my-12 rounded-2xl bg-soft border border-white/5 shadow-soft">
  <div class="text-5xl mb-6">🏆</div>
  <h2 class="text-2xl font-bold mb-4">Congratulations!</h2>
  <p class="text-lg mb-8">If you've made it this far, you've officially earned the title of:</p>
  <div class="text-4xl md:text-6xl font-black mb-6 text-accent tracking-tighter uppercase">
    FFmpeg Ruler
  </div>
  <div class="text-sm uppercase tracking-widest opacity-60">Certified by this blog</div>
</div>

---

In the next blog, I'll introduce another free software, that can cooperate with FFmpeg and make it even more stronger.

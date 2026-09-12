---
title: "FFmpeg: The Ultimate Cross-Platform Video Tool"
description: "Why FFmpeg is my daily driver for video/audio processing and a collection of useful commands."
pubDate: 2026-02-19
updateDate: 2026-09-12
tags:
  - FFmpeg
  - macOS
  - Video
  - Audio
  - CLI
---

I've always maintained that only cross-platform software merits long-term commitment. Final Cut Pro is indeed formidable, and Adobe's suite is undeniably capable, but neither runs natively on every operating system. Once you've grown accustomed to them, you've effectively tied yourself to the systems they run on. Departing from a particular platform means abandoning these familiar tools, significantly increasing your sunk costs.

But fear not, [FFmpeg](https://ffmpeg.org/) covers our asses.

I started using it by processing some simple tasks, such as trimming the duration of video or audio clips, extracting segments, merging multiple clips, changing the format of videos (e.g. .mkv to .mp4) to make them more compatible with different devices, re-encoding video and audio (e.g. H.264 to HEVC or Opus to AAC), compressing videos, changing their resolution and burning subtitles into videos.

These tasks are a daily driver for me at certain times, but they are not worth processing by launching a large app like Final Cut Pro. After some time of learning and hands-on practice, I've compiled a list of frequently used commands for reference.

---

## 1. Basic Trimming

Trimming a video without re-encoding is extremely fast as it simply copies the compressed data without decoding.

**Keep everything from 10 minutes onwards:**

```bash
ffmpeg -t 00:10:00 -i input.mp4 -c copy output.mp4
```

**Extract a 20-minute segment starting from 10:00:**

```bash
ffmpeg -ss 00:10:00 -i input.mp4 -t 00:20:00 -c copy output.mp4
```

**Trim the first 20 minutes:**

```bash
ffmpeg -ss 00:20:00 -i input.mp4 -c copy output.mp4
```

> [!TIP]
> Stream copying (`-c copy`) can only cut on keyframes (I-frames / IDR frames). If `10:00` is not an exact keyframe, FFmpeg seeks to the nearest preceding keyframe, which may make the output start slightly earlier or cause brief frozen frames in some video players. For frame-accurate cutting down to the millisecond, re-encode by removing `-c copy`.
>
> If you want to change the minutes or seconds, simply adjust the numbers in the command. However, if the time exceeds 1 hour, use the format `HH:MM:SS` (e.g., `1:10:00` instead of `70:00`).

---

## 2. Merging and Concatenation

If you have multiple clips with the same parameters (resolution, codec, etc.), you can merge them using the concat demuxer.

**Merge clips listed in `merge.txt`:**

```bash
ffmpeg -f concat -safe 0 -i merge.txt -c copy output.mp4
```

`merge.txt` should contain lines formatted as `file 'input.mp4'`. You can download a [template here](/merge.txt).

**Merge clips without a text file (Shell inline list):**

```bash
ffmpeg -f concat -safe 0 -i <(printf "file '%s'\n" input1.mp4 input2.mp4) -c copy output.mp4
```

On macOS or Linux (`zsh`/`bash`), process substitution (`<(...)`) feeds the file list directly from memory. This saves you from creating a physical `merge.txt` file on disk while keeping the blazing-fast, lossless stream copy (`-c copy`). All clips must still have identical codecs and parameters.

**Merge clips with different parameters (`concat` filter):**

```bash
ffmpeg -i input1.mp4 -i input2.mp4 -filter_complex \
"[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" \
-map "[v]" -map "[a]" output.mp4
```

Unlike the concat demuxer, the `concat` filter decodes and re-encodes the streams. This eliminates the need for an external file and seamlessly handles clips with different resolutions, framerates, or codecs, though it will take longer to encode.

**Side-by-side comparison with audio (1080p, High Quality):**

```bash
ffmpeg -i input1.mov -i input2.mp4 -filter_complex \
"[0:v]fps=60,scale=-2:1080[v0]; \
 [1:v]fps=60,scale=-2:1080[v1]; \
 [v0][v1]hstack=inputs=2[v]" \
-map "[v]" -map 1:a -c:v libx264 -crf 19 -preset medium -c:a aac -b:a 129k -pix_fmt yuv420p -shortest output_side_by_side_hq.mp4
```

Scales both inputs to 1080p height and places them side-by-side horizontally using `hstack`. It retains the audio track from the second video (`-map 1:a`), balances high quality with reasonable file size (`-crf 19`), and trims output to the shorter video (`-shortest`).

**Side-by-side comparison for desktop / text clarity (1800p, Near-lossless):**

```bash
ffmpeg -i input1.mov -i input2.mp4 -filter_complex \
"[0:v]fps=60,scale=-2:1800:flags=lanczos[v0]; \
 [1:v]fps=60,scale=-2:1800:flags=lanczos[v1]; \
 [v0][v1]hstack=inputs=2[v]" \
-map "[v]" -an \
-c:v libx264 -crf 12 -preset veryslow \
-x264-params "no-deblock=1:aq-mode=3:qcomp=0.8" \
-pix_fmt yuv420p -shortest output_ultra.mp4
```

Ideal for screen recording comparisons where text and UI sharpness matter. It scales to 1800p using the sharper `lanczos` algorithm, strips audio (`-an`), and disables in-loop deblocking (`no-deblock=1`) with `-crf 12` to prevent fine UI details and fonts from being smoothed out.

---

## 3. Encoding for Compatibility

Sometimes you need to ensure a video plays everywhere (QuickTime, Safari, iOS, smart TVs, and web browsers) by using standard H.264 settings with 8-bit YUV 4:2:0 chroma subsampling.

**High-quality H.264 re-encode for universal playback and storage:**

```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 18 -preset veryslow -pix_fmt yuv420p -c:a aac -b:a 129k -tag:v avc1 output.mp4
```

> [!TIP]
> Use this carefully, this performs CPU-heavy software encoding. While `-crf 18` with `-preset veryslow` delivers near-lossless visual quality, it can be quite slow. For everyday use, `-crf 23` with `-preset medium` provides an excellent balance of speed and quality. The `-pix_fmt yuv420p` flag is critical: without it, sources with 10-bit color, 4:4:4 chroma, or RGB color (common in screen recordings and image sequences) will produce high-profile streams that Apple devices and web browsers cannot play.

---

## 4. Burning Subtitles (Hardsubs)

Burning subtitles directly into the video stream ensures they show up on any player.

**Basic subtitle burn-in:**

```bash
ffmpeg -i input.mp4 -vf "subtitles=subtitle.srt" -c:a copy output.mp4
```

> [!TIP]
> When declaring filters, it is better to quote the entire filter string, i.e., `-vf "subtitles=subtitle.srt"` rather than `-vf subtitles="subtitle.srt"`. This ensures the shell correctly passes the entire string as a single argument to the `-vf` option.

**Burn subtitles with spaces in the filename (Best Practice):**

```bash
ffmpeg -i input.mkv -vf "subtitles='my subtitles.srt'" -c:a copy output.mkv
```

> [!TIP]
> If your subtitle filename has spaces or special characters, nest single quotes inside the double quotes holding the filter.

**Burn VTT subtitles with a specific font (Songti SC):**

```bash
ffmpeg -i input.mp4 -vf "subtitles=subtitle.vtt:force_style='FontName=Songti SC'" -c:v libx264 -crf 18 -preset veryslow -pix_fmt yuv420p -c:a aac -b:a 129k -tag:v avc1 output.mp4
```

> [!TIP]
> FFmpeg's `subtitles` filter also fully supports `.srt` and `.ass` formats. While `.vtt` and `.srt` may require `force_style` to look good, `.ass` files (Advanced SubStation Alpha) can contain their own rich styling, colors, and positioning data which FFmpeg will render perfectly out of the box. Note that `Songti SC` is a macOS system font, on Linux or Windows, replace it with an installed font such as `Noto Serif CJK SC` or `SimSun`.

---

## 5. Format Conversion and Optimization

Converting between formats like WebM to MP4 or using modern codecs like HEVC (H.265).

**Compress a video to 720p MP4 (H.264) _with audio re-encoding_:**

```bash
ffmpeg -i input.mp4 -vf scale=1280:720 -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -c:a aac -b:a 129k -tag:v avc1 output.mp4
```

**Compress a video to 10-bit 1080p MP4 (H.265) _with original audio codec_:**

```bash
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:v libx265 -crf 28 -preset slow -pix_fmt yuv420p10le -c:a copy -tag:v hvc1 output.mp4
```

> [!TIP]
> If you use `-vf scale=1280:-2`, FFmpeg will fix the width at 1280 and automatically calculate the height to preserve the original aspect ratio while guaranteeing the height is divisible by 2 (avoiding "height not divisible by 2" encoder errors with YUV 4:2:0). The commands above force fixed dimensions (1280:720 or 1920:1080), which will distort the aspect ratio if the input isn't already 16:9.

---

## 6. macOS Hardware Acceleration (VideoToolbox)

If you're on a Mac, using `videotoolbox` will significantly speed up the encoding process and save battery.

| 💡 GPU Compatibility Note |
| :--- |
| Hardware acceleration is split between **decoding** (reading inputs via `-hwaccel videotoolbox`) and **encoding** (writing outputs via `-c:v h264_videotoolbox` or `hevc_videotoolbox`). While H.264 and HEVC hardware decode/encode are supported across almost all modern Macs, formats like **AV1** hardware decoding are only available on Apple **M3** chips or newer. If your Mac does not support hardware decoding for a specific input format, simply omit `-hwaccel videotoolbox`, FFmpeg will decode smoothly on the CPU while still using VideoToolbox for fast hardware encoding. |

**Fast H.264 and Apple native AAC re-encoding:**

```bash
ffmpeg -hwaccel videotoolbox -i input.webm -c:v h264_videotoolbox -b:v 5000k -c:a aac_at -q:a 0 -tag:v avc1 output.mp4
```

**Fast 10-bit HEVC (H.265) and Apple native AAC re-encoding:**

```bash
ffmpeg -hwaccel videotoolbox -i input.webm -c:v hevc_videotoolbox -b:v 3000k -pix_fmt p010le -c:a aac_at -q:a 0 -tag:v hvc1 output.mp4
```

**HEVC and `aac_at` with Burned Subtitles:**

```bash
ffmpeg -i input.webm -vf subtitles=subtitle.vtt -c:v hevc_videotoolbox -b:v 2500k -pix_fmt p010le -c:a aac_at -q:a 0 -tag:v hvc1 output.mp4
```

> [!TIP]
> When burning subtitles with the `subtitles` filter, FFmpeg processes frames on the CPU in software memory, so omitting `-hwaccel videotoolbox` here is expected.

**H.264 with Burned Subtitles (Custom Font for Chinese):**

```bash
ffmpeg -i input.webm -vf "subtitles=subtitle.vtt:force_style='FontName=Songti SC'" -c:v h264_videotoolbox -b:v 4000k -c:a aac_at -q:a 0 -tag:v avc1 output.mp4
```

**HEVC with Burned Subtitles (Custom Font for Chinese):**

```bash
ffmpeg -i input.webm -vf "subtitles=subtitle.vtt:force_style='FontName=Songti SC'" -c:v hevc_videotoolbox -pix_fmt p010le -b:v 2500k -c:a aac_at -q:a 0 -tag:v hvc1 output.mp4
```

---

## 7. Audio Extraction

Extracting high-quality audio from video files.

**Extract audio to M4A without re-encoding (Fastest, Original Quality):**

```bash
ffmpeg -i input.mp4 -vn -c:a copy output.m4a
```

> [!TIP]
> Stream copying (`-c:a copy`) into `.m4a` requires the source audio to already be an MP4-compatible format (typically AAC or ALAC). If the video contains Opus, Vorbis, or DTS, re-encode it using the commands below or extract into its native container (e.g. `output.opus`).

**Extract audio to M4A using `libfdk_aac` re-encoding (VBR scale: 1 - 5, 5 is the highest quality):**

```bash
ffmpeg -i input.mp4 -vn -c:a libfdk_aac -vbr 5 output.m4a
```

**Extract audio to M4A using `aac_at` re-encoding (macOS Native, 0 - 14, 0 is the highest quality):**

```bash
ffmpeg -i input.mp4 -vn -c:a aac_at -q:a 0 output.m4a
```

> [!TIP]
> Notice the quality scale direction! Unlike `libfdk_aac` where `5` is the highest quality, Apple's `aac_at` uses a reverse scale where `0` is the highest quality (~192 kbps) and `14` is the lowest. Use `0`, `1`, or `2` for clean, high-fidelity sound.

---

### Advice for macOS Users (Homebrew & Audio Encoders)

If you find that some of these commands fit your requirements, or if you're interested in exploring more of what FFmpeg has to offer and are ready to install it on your Mac, here is some practical guidance.

First, an important clarification: **you do not need third-party taps just to get high-quality AAC audio on macOS**. Standard Homebrew FFmpeg (`brew install ffmpeg`) already has Apple's native `aac_at` (AudioToolbox AAC) enabled out of the box. `aac_at` is widely regarded as one of the best AAC encoders available, rivaling or exceeding `libfdk_aac` without compiling anything from source.

However, if you want non-free libraries like Fraunhofer's FDK AAC (`libfdk_aac`) for cross-platform script parity, or other optional features not included in core Homebrew even with `brew install ffmpeg-full`, you can use the [homebrew-ffmpeg/homebrew-ffmpeg](https://github.com/homebrew-ffmpeg/homebrew-ffmpeg) tap. According to the [official FFmpeg macOS compilation guide](https://trac.ffmpeg.org/wiki/CompilationGuide/macOS):

> Since v2.0, Homebrew does not offer options for its core formulae anymore. Users who want to build ffmpeg with additional libraries (including non-free ones) need to use so-called taps from third party repositories. These repositories are not maintained by Homebrew.

To install FFmpeg with custom options via the tap:

```bash
brew tap homebrew-ffmpeg/ffmpeg
brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-<option1> --with-<option2> ...
```

For example, to build with `libfdk_aac`:

```bash
brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-libfdk-aac
```

### Troubleshooting

While building with custom options increases flexibility, it comes with a maintenance cost. After running `brew upgrade`, you may occasionally notice your custom FFmpeg build breaking with dynamic linker `dyld` errors. This happens when Homebrew updates a shared library dependency (such as `x264` or `openssl`) to a new version path, leaving your custom-compiled FFmpeg linked to the old, deleted path.

Fortunately, it is easy to repair. Simply reinstall FFmpeg to recompile it against the updated libraries:

```bash
brew reinstall homebrew-ffmpeg/ffmpeg/ffmpeg
```

Homebrew remembers the `--with-*` options you originally selected and reapplies them during the reinstall.

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

In the next blog, I'll introduce another free software that can cooperate with FFmpeg and make it even stronger.

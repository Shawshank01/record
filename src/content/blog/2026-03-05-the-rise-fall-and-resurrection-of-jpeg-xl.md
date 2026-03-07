---
title: "The Rise, Fall, and Resurrection of JPEG XL"
description: "The story of JPEG XL's rollercoaster journey, and how you can embrace it on macOS."
pubDate: 2026-03-05
tags:
  - JPEG XL
  - macOS
  - Homebrew
  - Shortcuts
---

If you've read my [previous blog post](https://zaku.eu.org/blog/2026-02-26-blucher-procedural-justice-or-bureaucracy/), you may have noticed something odd — yes, because I used `.jxl` format images, which might prevent you from seeing them in most browsers.
My interest in JPEG XL began when I wrote a research paper on image compression during my graduate studies. While I admire the excellence of JPEG XL, I am astonished that at the time, there were almost no mainstream browsers supporting this format. Today, I finally have the chance to share with you the story of JPEG XL in a dramatic way.

---

# The Rise, Fall, and Resurrection of JPEG XL

## Act I: The Contender Arrives

The year is 2020. The world of image formats is a battlefield. WebP, Google's scrappy challenger, has been fighting for years to dethrone the ancient JPEG. PNG holds the lossless throne. And then — from the halls of the Joint Photographic Experts Group and the ashes of two competing proposals (Google's PIK and Cloudinary's FLIF) — a new format is born.

**JPEG XL.**

It was, by any technical measure, a marvel. It offered:
- Superior compression to JPEG, WebP, and AVIF in some scenarios
- Lossless *and* lossy modes
- HDR and wide color gamut support
- **Lossless JPEG recompression** — the killer feature that could shrink every JPEG on the internet by ~20% *without touching a single pixel*
- Progressive decoding, so images could load beautifully even over slow connections

The web community held its breath. Could this be *the one*?

---

## Act II: The Google Guillotine

Chrome shipped JPEG XL support behind a flag in 2021. Developers experimented. Photographers rejoiced. Advocates wrote breathless blog posts. The momentum felt real.

Then, in October 2022, the axe fell.

Google filed a Chromium bug — **not to fix JPEG XL, but to remove it**. The reasoning offered was thin and, to many, deeply suspicious: there wasn't "enough interest" from the ecosystem, and AVIF (a format Google had heavily invested in) supposedly covered the use cases.

The backlash was *immediate and volcanic*. The bug tracker became a war zone. Hundreds of developers, photographers, and engineers flooded the comments with technical arguments, pleas, and barely-concealed fury. The [thread](https://issues.chromium.org/issues/40168998) grew to become one of the most commented issues in Chromium's history.

Critics smelled a rat. Google had a vested interest in AVIF — it was derived from the AV1 video codec, which Google co-developed. JPEG XL threatened it directly. Was this a technical decision, or a *corporate* one?

Google didn't blink. In January 2023, Chrome's support was **removed**.

---

## Act III: The Wilderness

JPEG XL was now in the desert. Chrome — which commands over 60% of the browser market — had slammed the door. Without Chrome, web developers couldn't use the format. Without web developers, there was no ecosystem. Without an ecosystem, what was the point?

The format seemed doomed to join the graveyard of "technically superior formats that lost anyway" — a cemetery already crowded with headstones.

But something unusual happened in that wilderness.

**The community refused to bury it.**

The Chromium bug thread kept growing. Open-source advocates kept maintaining encoders like `cjxl`. The format's spec was finalized. And critically — other browsers were *watching*.

---

## Act IV: The Faithful Hold the Line

Safari had quietly shipped JPEG XL support in 2022 and **kept it**. Apple, with no stake in AVIF's success, had no reason to pull the plug. This was the lifeline.

Firefox sat on the fence. It had supported JPEG XL in its Nightly builds since version 90.0a1 in May 2021, but locked it behind the `image.jxl.enabled` flag in `about:config`. For years, they cited Chrome's decision as a reason to wait, keeping the door open but the feature firmly opted-in only.

Meanwhile, the JPEG XL advocates did something remarkable: they built the case *methodically and publicly*. Benchmarks were published. Real-world use cases were documented. The lossless JPEG recompression argument — imagine shrinking the internet's collective JPEG archive by 20% *for free* — gained new attention as bandwidth costs climbed.

The format found passionate homes in photography communities, archivists, and HDR content creators who needed what nothing else could offer.

---

## Act V: The Tide Turns

The dam began to crack. Edge followed Safari's quiet lead — and since Edge is Chromium-based, this was a quiet irony: a fork of Chrome was supporting what Chrome had rejected.

Then came the moment nobody had quite predicted: the CDN and infrastructure giants started caring. Cloudflare, Cloudinary, and others began supporting JPEG XL delivery, quietly building the ecosystem that Google said didn't exist.

As of March 2026, Firefox is on the precipice. While stable, beta, and developer editions still don't support it by default, Mozilla is actively integrating a new Rust-based decoder `jxl-rs`. The implementation is pending, but the groundwork for full support in a future stable release is being laid.

And then — slowly, without fanfare — Google itself began to reconsider. With the web ecosystem shifting, with Safari aligned and Firefox laying the foundation, with tooling maturing, the pressure on Chrome became harder to ignore.

---

## Epilogue: An Unfinished Story

As of today, JPEG XL is not yet universal. Chrome's support remains the missing piece that would truly complete the story. But the format is very much alive — supported natively in Apple's ecosystem (macOS, iOS, Safari), quietly available in Firefox Nightly, embraced by major CDNs, and living in countless tools.

The story of JPEG XL is ultimately a story about **who controls the web's infrastructure** and whether technical merit alone can survive corporate headwinds. It's a story about a community that refused to accept a burial decree, that kept writing code and making arguments until the ground shifted.

The JPEG survived for 30 years. Its successor, it seems, may be just stubborn enough to do the same.

*The arc is long. But it bends toward better compression.*

---

If you've read this far, I'm guessing you're quite interested in embracing JPEG XL. In the following section, you'll learn how to actually use it on macOS.

First, we need to install it on the device. If you already have FFmpeg on your Mac, it may already be installed. If not, install it using the following commands:

**1. Install Homebrew**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**2. Install JPEG XL tools**
```bash
brew install jpeg-xl
```

---

### Basic Conversions in Terminal

Once installed, you can use the command-line tools `cjxl` (to encode/compress) and `djxl` (to decode/decompress).

**Convert a JPEG to a JXL:**
```bash
cjxl input.jpeg output.jxl
```
*(Or `cjxl input.jpg output.jxl`)*

If you ever need that exact same `.jpg` file back (for an old app or for "bit-for-bit" proof), you use the decoder tool `djxl`:
```bash
djxl output.jxl restored.jpeg
```
*(Or `djxl output.jxl restored.jpg`)*

To verify it worked, you can check their MD5 hash (a digital fingerprint). If the fingerprints match, the files are bit-for-bit identical:
```bash
md5 input.jpeg restored.jpeg
```

**Convert a PNG file:**
```bash
cjxl input.png output.jxl
```

> **Tip:** If you want it to be mathematically, pixel-perfectly lossless (exactly like your PNG but highly compressed and smaller), use the `-d` (distance) flag set to 0:
> ```bash
> cjxl input.png output.jxl -d 0
> ```

---

## The Ultimate Shortcut: Right-Click Finder Actions

For greater convenience, you can use macOS's built-in **Shortcuts** app to turn these command-line operations into Quick Actions in the Finder's right-click menu, meaning you never have to open the Terminal again.

### Step 1: Create the Shortcut

1. Open the **Shortcuts** app on your Mac.
2. Click the **+** (plus) icon to create a new shortcut.
3. In the right-hand sidebar, click the **Shortcut Details** icon (the small "i" in a circle) and check the box **"Use as Quick Action"**.
4. Ensure **"Finder"** is selected under the Quick Action settings.
5. At the top of the main window, change the input to: *"Receive **Image** from **Quick Actions**."*

### Step 2: Add the "Run Shell Script" Action

1. Search for the **"Run Shell Script"** action in the sidebar and drag it into the shortcut.
    > By default, macOS disables scripting actions for security to prevent untrusted scripts from running automatically. You just need to flip a single toggle in the Shortcuts app settings:
    > - **Open Settings:** Click on the "Open Preferences" button directly in that error message, or go to the menu bar and select **Shortcuts > Settings**.
    > - **Go to Advanced:** Click on the **Advanced** tab.
    > - **Enable Scripts:** Check the box that says **Allow Running Scripts**.
2. Set the shell to `/bin/zsh`.
3. Set "Pass Input" to **"as arguments"**.
4. Fill in the code with the script below:

```zsh
# Path to homebrew binary (standard for Apple Silicon Macs)
CJXL_PATH="/opt/homebrew/bin/cjxl"

for f in "$@"
do
    # Create the output filename by replacing the extension
    output="${f%.*}.jxl"
    
    # Run the basic conversion
    $CJXL_PATH "$f" "$output"
done
```

> **Important Note:** If you are using an older Intel-based Mac, Homebrew installs to a different directory. Change the `CJXL_PATH` line to `"/usr/local/bin/cjxl"`.

### Step 3: Try it out!

1. Name it something like **"Convert to JXL"**, it should look like this:

![If you cannot see this image, either your browser does not support the JXL format, or it has been disabled by default.](/2026-03-05/convert-to-jxl-shortcuts.jxl)

2. Close the Shortcuts app.
3. Go to your **Finder** and select any image (PNG, JPG, etc.).
4. Right-click the image, go down to **Quick Actions**, and click **Convert to JXL**.
    > You may see a pop-up window the first time you run it:  
    > **“cjxl” would like to access files in your Downloads folder.**  
    > Just choose **Allow** this time and you will never see it again.
5. A small gear will spin in your menu bar, and seconds later, a highly-compressed `.jxl` file will magically appear in the same folder as your original image.

---

## How to Enable JPEG XL in Your Browser

Right now, Safari supports JPEG XL natively out-of-the-box on recent Apple devices. However, if you're on Chrome, Brave, or Firefox, you'll need to manually flip a few experimental flags to enable it while support is actively being developed.

### Google Chrome & Brave

1. Open a new tab in your browser.
2. In the address bar, type `chrome://flags` (for Chrome) or `brave://flags` (for Brave) and press **Enter**.
3. In the search bar at the top of the page, type `jxl`.
4. Locate the specific flag titled **Enable JXL image format** (or similar).
5. Click the dropdown menu next to it and change it from **Default** to **Enabled**.
6. Click the **Relaunch** button to restart your browser.

### Mozilla Firefox

1. Open a new tab and type `about:config` in the address bar. Press **Enter**.
2. If prompted with a warning, click **"Accept the Risk and Continue"**.
3. In the search box, type `image.jxl.enabled`.
4. Double-click the entry (or click the toggle button) to change its value from `false` to `true`.
5. Restart your browser.

---

## References

Jebaraj, S. D., & N, S. (2023). JPEG-XL based Compression of DICOM Images for Reduced Storage and Transmission Costs. *2023 3rd International Conference on Intelligent Technologies (CONIT)*, 1–6.  
https://doi.org/10.1109/conit59222.2023.10205928

Öztürk, E., & Mesut, A. (2021, September 1). Performance Evaluation of JPEG Standards, WebP and PNG in Terms of Compression Ratio and Time for Lossless Encoding. *IEEE Xplore*.  
https://doi.org/10.1109/UBMK52708.2021.9558922

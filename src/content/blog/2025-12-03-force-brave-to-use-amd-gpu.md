---
title: "How I Forced Brave to Use the AMD GPU on an Intel MacBook Pro"
description: "Brave Browser (Chromium) kept sticking to Intel iGPU for WebGL/WebGPU. Here’s the exact fix I used and a one-click Automator launcher to make it permanent."
pubDate: 2025-12-03
tags:
  - IT
  - macOS
  - Brave Browser
---

[Go to solution directly](#the-real-fix)

This issue has been bothering me for over half a year: ever since I got hooked on using the Brave browser, I've noticed that on my old 2018 MacBook Pro, it only utilizes the Intel integrated graphics and fails to leverage the discrete AMD GPU for rendering intensive tasks. This forces me to occasionally switch to Safari (WebKit sucks!) when encountering heavy rendering demands to achieve a smoother browsing experience. Today, I stumbled upon news that WebGPU has officially launched in major browsers. On a whim, I decided to tackle this issue.

First, I confirmed all settings are correct:

- Brave **Settings → System → Use graphics acceleration when available**: **ON**.
- macOS **Battery → Automatic graphics switching**: **OFF** (so the system prefers AMD).
- Terminal (system‑wide GPU preference):
  ```bash
  sudo pmset -a gpuswitch 1
  ```
  This tells macOS power management to **prefer the discrete GPU** when deciding between integrated vs discrete graphics. It’s a coarse, system‑level hint, useful for testing, but not a guaranteed per‑app lock.
  
  **Reset to default:**
  ```bash
  sudo pmset -a gpuswitch 2
  ```
  (`2` restores automatic switching.)
  
  Then reboot.

Despite all that, Brave still stubbornly used Intel.

---

## The Symptom

To reproduce the problem, I used a classic GPU-stressing WebGL demo from [Three.js](https://threejs.org/):

- In **Safari**, opening the Three.js animation example immediately flipped the machine to the discrete AMD GPU with stable 60 FPS.
- In **Brave**, the same page stayed on the Intel iGPU, even under obvious heavy rendering load, barely reached 30 FPS.

I checked the report from [brave://gpu](brave://gpu), which showed that Brave was clearly *hardware-accelerating*, just on the wrong adapter.

---

## What `brave://gpu` Revealed

I opened `brave://gpu` and found something like this:

- Both GPUs were detected:
  - **AMD Radeon Pro Vega 20**
  - **Intel UHD Graphics 630**
- But Brave marked the Intel chip as **ACTIVE**, and WebGL reported:
  - `GL_RENDERER: ANGLE Metal Renderer: Intel UHD Graphics 630`

So it wasn’t a software fallback. Chromium was simply choosing the low‑power GPU and sticking to it.

---

<a id="the-real-fix"></a>
## The Real Fix: Force High‑Performance GPU at Launch

Since the Chromium flag to force high‑performance GPU is **not available on Intel dual‑GPU macOS builds**, there’s no UI toggle that persists this choice.

But Chromium still honors a startup argument that overrides the early GPU selection:

```bash
open -a "Brave Browser" --args --force_high_performance_gpu
```

After launching Brave this way, [brave://gpu](brave://gpu) finally showed the AMD GPU as **ACTIVE**, and the Three.js demo ran just as smoothly as it did in Safari.

### Why this works

Chromium decides which GPU to bind **very early during startup** for its GPU process. On dual‑GPU Macs it defaults to the integrated Intel chip for battery life, and once that choice is made, most WebGL/WebGPU contexts follow it for the rest of the session. It seems this "bug" still exists until today (see Chromium issue [#393263507](https://issues.chromium.org/issues/393263507)).

The `--force_high_performance_gpu` argument injects a “prefer discrete GPU” directive *before* that decision locks in, so the GPU process starts on AMD, and all rendering follows.

Functionally this is the same behavior the missing `force-high-performance-gpu` flag would provide if it were supported on this platform, it’s just applied through a launch argument instead of Brave’s flags UI.

---

## Make It Permanent: One‑Click Automator Launcher

Typing the launch command every time is annoying, so I made a tiny Automator app that starts Brave in AMD mode.

1. Open **Automator** → **New Document** → choose **Application**.
2. Add **Run Shell Script**.
3. Set shell to `/bin/zsh` and paste:
   ```bash
   open -a "Brave Browser" --args --force_high_performance_gpu
   ```
4. Save as something like **Brave AMD.app**.
5. Drag **Brave AMD.app** into the Dock and remove the original Brave icon.

Here’s what the Automator setup looks like:

![Automator launcher setup](/automator-setup.png)

Now every time I click the Dock icon, Brave launches using the AMD GPU.

---

## Bonus: Make the Launcher Look Like Brave

Because the launcher is a separate app, it has a generic Automator icon by default. I changed it to the Brave icon:

1. Finder → **Applications** → right‑click **Brave Browser.app** → **Get Info**.
2. Click the small Brave icon top‑left to highlight it.
3. Press **Cmd‑C**.
4. Right‑click **Brave AMD.app** → **Get Info**.
5. Click its small icon top‑left and press **Cmd‑V**.

If the Dock doesn’t update immediately, remove/re‑add the launcher.

---

## Tradeoffs

Forcing the discrete GPU means:

- **More battery drain**.
- **More heat/fan usage**.

For me that’s a fair trade whenever I’m doing heavy WebGL/WebGPU stuff (3D demos, map visualizations, creative coding, etc.). Daily browsing on battery? I can still open the normal Brave app if I want Intel. Not to mention, the battery on my MacBook Pro hasn't been able to last through a single hour of normal use for ages, I couldn't care less about battery life.

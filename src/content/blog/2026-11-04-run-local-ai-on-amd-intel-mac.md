---
title: "Run Local AI on Intel Mac & AMD GPU via llama.cpp"
description: "Unlock up to 3–5× faster local AI inference on a Vega 20 Intel MacBook Pro by compiling llama.cpp with Vulkan and MoltenVK instead of CPU-bound Ollama."
pubDate: 2026-11-04
updateDate: 2026-11-09
tags:
  - AI
  - macOS
  - MacBook (x86)
  - MacPorts
  - CLI
---

If you own an older Intel-based MacBook Pro (as I do) equipped with a discrete AMD GPU (such as the Radeon Pro Vega 20 or Radeon Pro 5300M/5500M), running local Large Language Models (LLMs) can be an exercise in frustration. Popular, user-friendly inference runtimes like Ollama run strictly on the CPU on Intel macOS, leaving your discrete GPU completely idle while your fans scream at maximum RPM.

By switching from Ollama to **`llama.cpp`** configured with **Vulkan over MoltenVK**, you can harness your AMD GPU's dedicated high-bandwidth memory and achieve token generation speeds roughly **3× to 5× faster in testing** compared to CPU-only execution on this hardware.

This guide walks you through the entire process from scratch: installing dependencies using **MacPorts**, compiling `llama.cpp` with Vulkan acceleration, and running optimised GGUF models both from the command line and as an OpenAI-compatible local API server.

---

## Why Ollama Runs CPU-Only on Intel Macs

When you launch an Ollama local model on an Intel Mac running macOS Sequoia (or earlier) and run `ollama ps`, the processor column invariably reports `100% CPU`.

* **Ollama's GPU acceleration targets Apple Silicon:** While Intel Macs with compatible AMD GPUs support Apple's Metal framework (which MoltenVK itself runs on), upstream Ollama limits Metal compute acceleration strictly to Apple Silicon (`arm64`). On `x86_64` macOS, Ollama intentionally falls back to CPU-only execution (documented in [Ollama's GPU guide](https://github.com/ollama/ollama/blob/main/docs/gpu.mdx) and [Issue #1016](https://github.com/ollama/ollama/issues/1016)).
* **No macOS ROCm or Vulkan in Ollama:** While Ollama supports AMD GPUs via ROCm on Linux and Vulkan on Windows, it ships with neither backend for macOS.

## Why Discrete GPU Matters: Memory Bandwidth

LLM autoregressive token generation is fundamentally memory-bandwidth bound:

* **Intel System RAM (DDR4-2400):** Delivers roughly **~38 GB/s** of memory bandwidth.
* **AMD Radeon Pro Vega 20 (4 GB HBM2):** Delivers **~189 GB/s**, nearly **5× faster** memory bandwidth.

Offloading model weights to the discrete GPU's memory allows it to stream weights to compute cores significantly faster than the CPU ever could over the system memory bus.

---

## Hardware Constraints & Recommended Settings

On an Intel MacBook Pro equipped with a discrete AMD GPU (tested on a 2018 15-inch model with the Radeon Pro Vega 20 under macOS Sequoia), achieving stability required navigating three hardware-specific settings:

1. **Vulkan over MoltenVK instead of Metal (`-DGGML_METAL=OFF -DGGML_VULKAN=ON`):** While `llama.cpp` compiles cleanly with the native Metal backend (`-DGGML_METAL=ON`), running inference on the Vega 20 produces corrupted tensor outputs and repetitive multilingual gibberish tokens. Because `llama.cpp`'s Metal kernels rely on Apple Silicon unified memory and SIMD matrix primitives, routing Vulkan through MoltenVK is necessary for rock-solid stability and coherent text.
2. **Cap the Context Window (`-c 4096` or `-c 8192`):** Modern models often default to 32k or 128k context windows. On a 4 GB VRAM card, allocating an oversized KV cache rapidly exhausts available memory. When VRAM is exceeded, macOS may either silently thrash memory across the PCIe bus (crashing generation speeds down to ~0.5 tokens/sec) or fail outright with allocation errors. Use `-c 4096` for ~3B models, while sub-2B models can comfortably run `-c 8192`.
3. **The Flash Attention Trade-off (`-fa on` vs `-fa off`):** Flash Attention works stably under Vulkan on the Vega 20 without crashes or corruption, but introduces a distinct performance trade-off:
   * **`-fa on`** delivers roughly **3.7× faster prompt processing** (jumping from 11.7 t/s up to 43.4 t/s), making it optimal for long prompts, codebases, or documents.
   * **`-fa off`** provides faster **token generation** during streaming (31.2 t/s vs 21.4 t/s), which is ideal for short conversational Q&A.

---

## Step 1: Install Build Dependencies via MacPorts

Because Homebrew has dropped active support and prebuilt bottles for older Intel macOS configurations, **MacPorts** is the most reliable package manager for `x86_64` Intel Macs.

Open your Terminal and install the required build tools, Vulkan headers, and MoltenVK:

```bash
sudo port install cmake git libomp vulkan-headers vulkan-loader MoltenVK glslang shaderc spirv-headers
```

### Verify the Installation

Confirm that the Vulkan dynamic library and the MoltenVK driver manifest are present in `/opt/local`:

```bash
ls -l /opt/local/lib/libvulkan.dylib /opt/local/share/vulkan/icd.d/MoltenVK_icd.json
```

Both files should exist without errors.

> [!TIP]
> **Automatic Driver Discovery:** Because `vulkan-loader` and `MoltenVK` are both installed through MacPorts, MacPorts' Vulkan loader automatically searches `/opt/local/share/vulkan/icd.d` for MoltenVK by default—meaning you do not need to prefix commands with `VK_ICD_FILENAMES`.
>
> If you want to ensure any standard or third-party macOS Vulkan loader finds MoltenVK globally, you can optionally symlink it to macOS's standard user Vulkan directory:
>
> ```bash
> mkdir -p ~/Library/Application\ Support/vulkan/icd.d
> ln -sf /opt/local/share/vulkan/icd.d/MoltenVK_icd.json ~/Library/Application\ Support/vulkan/icd.d/
> ```

---

## Step 2: Clone and Compile llama.cpp with Vulkan

Select a working directory and clone the official `llama.cpp` repository from GitHub:

```bash
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp
```

> [!NOTE]
> This guide was tested against `llama.cpp` release builds ( `0.9.0-dev` / `12211`). If you require exact version reproducibility or want to pin to a specific verified release, check out a tagged release with `git checkout tags/<release-tag>` before compiling.

### Configure CMake

Configure the build directory by disabling Metal and enabling the Vulkan backend:

```bash
cmake -B build -DGGML_METAL=OFF -DGGML_VULKAN=ON
```

During configuration, CMake should confirm Vulkan detection:

```text
-- Found Vulkan: /opt/local/lib/libvulkan.dylib (found version "1.4.363")
-- Including Vulkan backend
```

> [!NOTE]
> You may see a message: `CMake Warning: OpenMP not found`. This is because Apple's default Clang compiler does not bundle OpenMP headers or runtimes. In this scenario, `llama.cpp` defaults to standard C++ pthreads for CPU multi-threading, while Apple's native Accelerate framework (BLAS) handles CPU linear algebra routines independently. While missing OpenMP can modestly impact CPU thread performance during CPU-bound tasks, primary matrix operations run on Vulkan. Recommend checking CMake's output to verify which acceleration features (such as `VULKAN` and `ACCELERATE`) were detected.

### Build the Binaries

Compile the executables:

```bash
cmake --build build --config Release -j
```

Verify that the CLI binary was generated:

```bash
ls -lh build/bin/llama-cli
```

> A binary size around ~25 KB is normal, as `llama.cpp` dynamically links against `libllama.dylib` and `libggml.dylib` in `build/bin/`.

---

## Step 3: Verify GPU Recognition

Before running any models, verify that MoltenVK correctly enumerates your discrete AMD GPU:

```bash
./build/bin/llama-cli --list-devices
```

MoltenVK should report your discrete GPU and available VRAM. In my case, the results were:

```text
[mvk-info] GPU device:
  model: AMD Radeon Pro Vega 20
  type: Discrete
  GPU memory available: 4080 MB
```

---

## Step 4: Download and Run an LLM

You can download **GGUF models** directly from Hugging Face using the `-hf` flag without needing to manually fetch files in your browser.

### Using GGUF

**GGUF (GGML Unified Format)** is the binary format developed by the `llama.cpp` team to store and execute LLMs efficiently on consumer hardware.

While some specialised runtimes can load raw Hugging Face weights (`.safetensors`), lightweight C/C++ inference engines like `llama.cpp` require models converted into GGUF. GGUF solves four key operational challenges:

1. **Unified Packaging:** Standard models split architecture definitions, tokenizer configs, vocabularies, and tensor weights across multiple separate files (`config.json`, `tokenizer.json`, weight shards). GGUF encapsulates all metadata, optional chat templates, and tensor data together—either in a single self-contained `.gguf` binary or organised multi-file split shards (`llama-split`).
2. **Native Quantisation for Constrained VRAM:** Models are typically released at 16-bit precision (FP16/BF16), requiring 6–8 GB of memory for even a 3B model. GGUF provides pre-quantised lower-precision representations: `Q4_K_M` shrinks model size by ~70–75%, while `Q5_K_M` provides roughly a ~60–65% reduction (for example, shrinking LFM3 1.7B from 3.47 GB BF16 down to 1.26 GB), allowing 3B parameter models to comfortably fit inside 4 GB VRAM.
3. **Zero Python Overhead:** GGUF models are parsed directly by lightweight C/C++ runtimes without requiring PyTorch, CUDA, or Python environments.
4. **Direct Memory Mapping (`mmap`):** GGUF aligns binary tensors so the operating system can memory-map (`mmap`) weights from SSD directly into memory in seconds.

Here is the command to run **Liquid AI's LFM3 1.7B** (a lightweight hybrid convolution/attention model that runs exceptionally well on constrained hardware):

```bash
./build/bin/llama-cli \
  -hf LiquidAI/LFM3-1.7B-GGUF:Q5_K_M \
  -ngl 99 \
  -c 8192 \
  -fa off \
  --temp 0.1 \
  --top-k 50 \
  --repeat-penalty 1.1
```

Command Breakdown:

* `-hf LiquidAI/LFM3-1.7B-GGUF:Q5_K_M`: Automatically downloads and caches the quantised GGUF file from Hugging Face into `~/.cache/huggingface/hub/` (specifically under `models--LiquidAI--LFM3-1.7B-GGUF/`).
* `-ngl 99`: Offloads all model layers to the GPU.
* `-c 8192`: Caps context size to 8,192 tokens. For lightweight 1B–1.7B models, 8k context comfortably fits inside 4 GB VRAM alongside the weights (~1.85 GB total). For heavier 3B models, cap at `-c 4096`.
* `-fa off`: Disables flash attention for maximum streaming token generation speed (~31.2 t/s). Switch to `-fa on` if you prioritize prompt ingestion speed for longer documents (jumping from 11.7 t/s to ~43.4 t/s).
* `--temp 0.1 --top-k 50 --repeat-penalty 1.1`: Sampling parameters recommended for LFM3.

### Performance and Benchmarks

**Hardware:** 2018 15-inch MacBook Pro (2.6 GHz 6-Core Intel Core i7, 32 GB 2400 MHz DDR4, AMD Radeon Pro Vega 20 with 4 GB HBM2) running macOS 15 Sequoia.

During startup, the loader confirms device initialisation:

```text
[mvk-info] Created VkDevice to run on GPU AMD Radeon Pro Vega 20
```

> [!NOTE]
> Diagnostic notices such as `[mvk-warn] VK_ERROR_FEATURE_NOT_PRESENT: Non-Apple GPUs do not fully support robustness` are typical for AMD GPUs running under MoltenVK on macOS (due to missing buffer robustness features in the underlying driver); during testing on this machine, the notice did not cause crashes or observable output degradation.

**Model Tested:** Liquid AI's LFM3 1.7B (`Q5_K_M` quantisation, 1.26 GB).

#### Empirical Comparison Across Backends & Settings

| Backend & Configuration | Prompt Processing (PP) | Token Generation (TG) | Output Quality & Stability |
| :--- | :--- | :--- | :--- |
| **Vulkan (`-fa off`)** | 11.7 t/s | **31.2 t/s** | ✅ Stable & coherent; fastest streaming speed |
| **Vulkan (`-fa on`)** | **43.4 t/s** | 21.4 t/s | ✅ Stable & coherent; **3.7× faster prompt ingestion** |
| **Native Metal (`-fa off`)** | 11.4 t/s | 8.5 t/s | ❌ Broken; repetitive token loops (`选择 stran...`) |
| **Native Metal (`-fa on`)** | 10.6 t/s | 7.2 t/s | ❌ Broken; tensor corruption (`-nlopyright gg...`) |
| **Ollama 0.40.15 (CPU-Only)** | ~10 t/s | ~6–10 t/s | ⚠️ 100% CPU, max fan noise |

Under Vulkan, GPU utilisation sits around 80%. Compared to Ollama (CPU-only), which manages only ~6 to 10 tokens/sec with loud fan noise and near 100% CPU core saturation, Vulkan delivers a substantial **3× to 5× speedup** while keeping system responsiveness high.

### Calculate Models You Can Run

According to this [video](https://youtu.be/rPGJhrunbxo?t=906), you can use this formula to calculate the maximum size of a model that can be run theoretically:

Total RAM * 0.75 / 0.6 = Amount of Parameters of The Model

> [!TIP]
> Note that while this formula uses "Total RAM" for unified-memory Macs (such as Apple Silicon) or pure CPU setups, on an Intel Mac with a discrete GPU you should substitute your dedicated **VRAM** instead.

So for me, it should be 4 * 0.75 / 0.6 = 5, which means ideally I should run LLM models with fewer than 5B parameters on my GPU.

### Best Models for 4 GB VRAM

To prevent VRAM paging across the PCIe bus, choose quantised GGUF models whose file size fits comfortably within my 4 GB VRAM (ideally under 3 GB, allowing sufficient headroom for the KV cache):

| Model | Quantisation | Size | Best Use Case |
| :--- | :--- | :--- | :--- |
| [Liquid AI LFM3 1.7B](https://huggingface.co/LiquidAI/LFM3-1.7B-GGUF) | `Q5_K_M` | 1.26&nbsp;GB | Designed for local agents, tool calling, structured outputs, and domain-specific fine-tuning |
| [Qwen3 1.7B](https://huggingface.co/Qwen/Qwen3-1.7B-GGUF) | `Q8_0` | 1.83&nbsp;GB | Delivers groundbreaking advancements in reasoning, instruction-following, agent capabilities, and multilingual support |
| [SparkLLM Spark-X2.6 1.7B](https://huggingface.co/XHToken/Spark-X2.6-1.7B-GGUF) | `Q8_0` | 1.82&nbsp;GB | Stronger coding, agentic, and long-context capabilities |
| [Google Gemma 4 E2B it](https://huggingface.co/google/gemma-4-E2B-it-qat-q4_0-gguf) | `Q4_0` | 3.35&nbsp;GB | Multimodal, handling text and image input and generating text output |

### Troubleshooting: Driver Not Detected?

While MacPorts' Vulkan loader discovers MoltenVK automatically, if `./build/bin/llama-cli --list-devices` does not display your AMD GPU (for instance, when using an alternative shell environment or a different loader), you can explicitly export the manifest path in your shell profile:

```bash
echo 'export VK_ICD_FILENAMES=/opt/local/share/vulkan/icd.d/MoltenVK_icd.json' >> ~/.zshrc
source ~/.zshrc
```

---

## Running as an OpenAI-Compatible API Server (`llama-server`)

If you want external applications, IDE extensions, or web interfaces to connect to your local model, use **`llama-server`** instead of the interactive terminal client (`llama-cli`).

`llama-server` provides an OpenAI-compatible HTTP interface exposing `/v1/chat/completions` and `/v1/models`.

### Launching the Server

From your `llama.cpp` repository directory:

```bash
./build/bin/llama-server \
  -hf LiquidAI/LFM3-1.7B-GGUF:Q5_K_M \
  --alias lfm-1.7b \
  --host 127.0.0.1 \
  --port 8080 \
  -ngl 99 \
  -c 8192 \
  -fa off \
  --temp 0.1 \
  --top-k 50 \
  --repeat-penalty 1.1 \
  --jinja
```

* **`--alias lfm-1.7b`**: Configures the model identifier that API clients request in payloads.
* **`--host 127.0.0.1 --port 8080`**: Binds the HTTP listener locally.
* **Built-in Web Interface**: Visiting `http://localhost:8080` in your browser opens a clean, responsive web chat interface.

### Connecting External Applications

Any application supporting OpenAI-compatible endpoints can connect using these parameters:

| Configuration Setting | Value |
| :--- | :--- |
| **Base URL** | `http://127.0.0.1:8080/v1` |
| **API Key** | Leave it blank (or enter a dummy key like `local`) |
| **Model Name** | `lfm-1.7b` (matching the `--alias` value passed to `llama-server`) |

### Common Client Examples

* **Web Frontends (Open WebUI, LibreChat, Chatbox):** Choose the OpenAI provider, point the endpoint to `http://127.0.0.1:8080/v1`, and set the model to `lfm-1.7b`.
* **AI Assistants & IDE Extensions (Continue, Cursor, Raycast):** Configure a custom OpenAI provider with `http://127.0.0.1:8080/v1` as the base address.
* **Command Line (`curl`):**

  ```bash
  curl http://127.0.0.1:8080/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
      "model": "lfm-1.7b",
      "messages": [{"role": "user", "content": "Explain RAM vs VRAM simply."}]
    }'
  ```

* **Python (`openai` SDK):**

  ```python
  from openai import OpenAI

  client = OpenAI(base_url="http://127.0.0.1:8080/v1", api_key="local")
  response = client.chat.completions.create(
      model="lfm-1.7b",
      messages=[{"role": "user", "content": "Hello!"}]
  )
  print(response.choices[0].message.content)
  ```

### Running the Server in the Background

To detach the server and run it silently in the background:

```bash
nohup ./build/bin/llama-server \
  -hf LiquidAI/LFM3-1.7B-GGUF:Q5_K_M \
  --alias lfm-1.7b \
  --port 8080 \
  -ngl 99 -c 8192 -fa off > server.log 2>&1 &
```

When you are done, terminate the background process with:

```bash
killall llama-server
```

---

## Delete Local Model

When you download models using the `-hf` flag, `llama.cpp` adheres to Hugging Face Hub cache conventions. It resolves cache directories in priority order (`LLAMA_CACHE`, `HF_HUB_CACHE`, `HUGGINGFACE_HUB_CACHE`, `HF_HOME`, `XDG_CACHE_HOME`), falling back by default to `~/.cache/huggingface/hub/` rather than macOS's native `~/Library/Caches/` directory.

### Check Disk Space & List Models

Inspect how much storage your cached models are consuming and view their file names:

Check total size of cached models:

```bash
du -sh ~/.cache/huggingface/hub/
```

List all downloaded model repositories:

```bash
ls -lh ~/.cache/huggingface/hub/
```

Inspect specific downloaded GGUF files in snapshots:

```bash
ls -lh ~/.cache/huggingface/hub/models--*/snapshots/*
```

### Delete a Specific Model

To remove an individual model repository (such as Liquid AI's LFM3):

```bash
rm -rf ~/.cache/huggingface/hub/models--LiquidAI--LFM3-1.7B-GGUF/
```

### Delete All Cached Models

> [!WARNING]
> The `~/.cache/huggingface/hub/` directory is shared across all applications using the Hugging Face Hub on your system (including Python `transformers`, `diffusers`, or other local AI tools). Running the deletion command below removes cached models across all applications sharing that directory, not just those downloaded by `llama.cpp`.

To wipe all cached Hugging Face models and reclaim all model storage:

```bash
rm -rf ~/.cache/huggingface/hub/models--*
```

---

## Update llama.cpp

Check your currently installed build number and commit hash in llama.cpp folder:

```bash
./build/bin/llama-cli --version
```

To update `llama.cpp` while retaining the Vulkan and MoltenVK acceleration configuration for your AMD GPU, pull the latest changes from the upstream repository and recompile the binaries:

### Step 1: Stop Any Running Server

If you have `llama-server` running in the background, terminate the process first so the binaries can be overwritten cleanly:

```bash
killall llama-server
```

### Step 2: Pull the Latest Changes

Navigate to your `llama.cpp` directory and pull the latest commits:

```bash
git pull
git submodule update --init --recursive
```

### Step 3: Recompile with Vulkan Support

Re-run CMake using the Vulkan configuration flags:

```bash
cmake -B build -DGGML_METAL=OFF -DGGML_VULKAN=ON
cmake --build build --config Release -j
```

> [!TIP]
> If a major upstream update introduces breaking build errors or stale CMake cache issues, perform a clean build by deleting the `build/` directory before compiling:
>
> ```bash
> rm -rf build
> cmake -B build -DGGML_METAL=OFF -DGGML_VULKAN=ON
> cmake --build build --config Release -j
> ```

### Step 4: Verify the Update

Verify that the newly compiled binary reports the expected version:

```bash
./build/bin/llama-cli --version
```

And confirm that MoltenVK successfully detects your AMD GPU:

```bash
./build/bin/llama-cli --list-devices
```

---

If you've managed to keep your older Mac out of retirement, you might want to check out my media downloader [VidButler](https://github.com/Shawshank01/VidButler). It just got a major overhaul and now features a local or cloud AI assistant to make downloading, editing, and managing media completely hassle-free. Any and all feedback is welcome!

---
title: "Run Local AI on Intel Mac & AMD GPU via llama.cpp"
description: "Unlock 4× faster local AI inference on a Vega 20 Intel MacBook Pro by compiling llama.cpp with Vulkan and MoltenVK instead of CPU-bound Ollama."
pubDate: 2026-11-04
tags:
  - AI
  - macOS
  - MacBook (x86)
  - MacPorts
  - CLI
---

If you own an old Intel-based MacBook Pro (like me) equipped with a discrete AMD GPU (such as the Radeon Pro Vega 20 or Radeon Pro 5300M/5500M), running local Large Language Models (LLMs) can be an exercise in frustration. Popular, user-friendly inference runtimes like Ollama run strictly on the CPU on Intel macOS, leaving your discrete GPU completely idle while your fans scream at maximum RPM.

By switching from Ollama to **`llama.cpp`** configured with **Vulkan over MoltenVK**, you can harness your AMD GPU's dedicated high-bandwidth memory and achieve token generation speeds **4× faster** than CPU execution.

This guide walks through from scratch using **MacPorts**, compiling `llama.cpp` with Vulkan acceleration, and running optimised GGUF models both from the command line and as an OpenAI-compatible local API server.

---

## Why Ollama Runs CPU-Only on Intel Macs

When you launch an Ollama local model on an Intel Mac running macOS Sequoia (or earlier) and run `ollama ps`, the processor column invariably reports `100% CPU`.

* **Metal is Apple Silicon-only:** Ollama's macOS acceleration specifically targets Apple Silicon's unified memory architecture (`arm64`). Upstream Ollama deliberately disables Metal compute on `x86_64` macOS.
* **No macOS ROCm or Vulkan:** Ollama supports AMD GPUs via ROCm on Linux and Vulkan on Windows, but ships with neither backend for macOS.

## Why Discrete GPU Matters: Memory Bandwidth

LLM autoregressive token generation is fundamentally memory-bandwidth bound:

* **Intel System RAM (DDR4-2400):** Delivers roughly **~38 GB/s** of memory bandwidth.
* **AMD Radeon Pro Vega 20 (4 GB HBM2):** Delivers **~189 GB/s**, nearly **5× faster** memory bandwidth.

Offloading model weights to the discrete GPU's memory allows it to stream weights to compute cores significantly faster than the CPU ever could over the system memory bus.

---

## Essential Technical Constraints Before You Start

Running AMD GPUs via `llama.cpp` on macOS requires navigating three critical constraints:

1. **Do Not Use the Metal Backend (`-DGGML_METAL=OFF`):** Apple's Metal implementation in `llama.cpp` causes kernel timeouts, device resets, or corrupted tensor outputs on discrete AMD macOS cards. You must use the **Vulkan backend mapped through MoltenVK**.
2. **Cap the Context Window (`-c 4096` or `-c 8192`):** Modern models default to 32k or 128k context windows. On a 4 GB VRAM card, allocating a massive KV cache quickly exhausts available memory. Once VRAM is oversubscribed, macOS silently pages memory over the PCIe bus, dropping token generation down to a crawling ~0.5 tokens/sec. Use `-c 4096` for ~3B models, while lightweight models under 2B can easily handle `-c 8192`.
3. **Disable Flash Attention (`-fa 0`):** AMD GCN and Vega architectures can trigger MoltenVK shader translation faults when Flash Attention is active. Setting `-fa 0` ensures rock-solid stability.

---

## Step 1: Install Build Dependencies via MacPorts

Because Homebrew has dropped active support and prebuilt bottles for older Intel macOS configurations, **MacPorts** is the most reliable package manager for `x86_64` Intel Macs.

Open your Terminal and install the required build tools, Vulkan headers, and MoltenVK:

```bash
sudo port install cmake git libomp vulkan-headers vulkan-loader MoltenVK glslang shaderc
```

### Verify the Installation

Confirm that the Vulkan dynamic library and the MoltenVK driver manifest are present in `/opt/local`:

```bash
ls -l /opt/local/lib/libvulkan.dylib /opt/local/share/vulkan/icd.d/MoltenVK_icd.json
```

Both files should exist without errors.

---

## Step 2: Clone and Compile llama.cpp with Vulkan

Select a directory, clone the official `llama.cpp` repository from GitHub:

```bash
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp
```

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
> You may see a warning: `CMake Warning: OpenMP not found`. This is expected and harmless. Apple's default Clang compiler does not bundle OpenMP, CMake falls back to macOS's native Accelerate Framework (BLAS) for CPU routines while primary matrix math executes on Vulkan.

### Build the Binaries

Compile the executables:

```bash
cmake --build build --config Release -j
```

Verify that the CLI binary was generated:

```bash
ls -lh build/bin/llama-cli
```

> A binary size around ~25 KB is normal, `llama.cpp` dynamically links against `libllama.dylib` and `libggml.dylib` in `build/bin/`.

---

## Step 3: Verify GPU Recognition

Before running any models, verify that MoltenVK correctly enumerates your discrete AMD GPU:

```bash
VK_ICD_FILENAMES=/opt/local/share/vulkan/icd.d/MoltenVK_icd.json \
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

You can download GGUF models directly from Hugging Face using the `-hf` flag without needing to manually fetch files in your browser.

Here is the command to run **Liquid AI's LFM3 1.7B** (a lightweight hybrid convolution/attention model that runs exceptionally well on constrained hardware):

```bash
VK_ICD_FILENAMES=/opt/local/share/vulkan/icd.d/MoltenVK_icd.json \
  ./build/bin/llama-cli \
  -hf LiquidAI/LFM3-1.7B-GGUF:Q4_K_M \
  -ngl 99 \
  -c 8192 \
  -fa 0 \
  --temp 0.1 \
  --top-k 50 \
  --repeat-penalty 1.1
```

### Command Breakdown

* `VK_ICD_FILENAMES=...`: Directs the Vulkan loader to MacPorts' MoltenVK ICD manifest.
* `-hf LiquidAI/LFM3-1.7B-GGUF:Q4_K_M`: Automatically downloads and caches the 4-bit quantized GGUF file from Hugging Face into `~/.cache/llama.cpp/`.
* `-ngl 99`: Offloads all model layers to the GPU.
* `-c 8192`: Caps context size to 8,192 tokens. For lightweight 1B–1.7B models, 8k context comfortably fits inside 4 GB VRAM alongside the weights (~1.85 GB total). For heavier 3B models, cap at `-c 4096`.
* `-fa 0`: Disables flash attention to prevent shader translation faults.
* `--temp 0.1 --top-k 50 --repeat-penalty 1.1`: Sampling parameters recommended for LFM3.

---

## Performance and Benchmarks

During startup, the loader confirms device initialisation:

```text
[mvk-info] Created VkDevice to run on GPU AMD Radeon Pro Vega 20
...
[ Prompt: 4.7 t/s | Generation: 34.4 t/s ]
```

### Results Comparison on 2018 MacBook Pro (RAM 32 GB, Vega 20 4 GB)

* **Ollama (CPU-only, Accelerate BLAS):** ~6 to 10 tokens/sec (loud fan noise, CPU thermal saturation).
* **llama.cpp (Vulkan + MoltenVK on Vega 20):** **34.4 tokens/sec** (responsive generation, around 80% GPU usage).

> [!NOTE]
> Diagnostic info `[mvk-warn] VK_ERROR_FEATURE_NOT_PRESENT: Non-Apple GPUs do not fully support robustness` are normal for AMD GPUs running under MoltenVK on macOS and do not affect inference stability or output quality.

---

## Best Models for 4 GB VRAM

To prevent VRAM paging across the PCIe bus, choose quantised GGUF models whose file size remains under ~2.5 GB:

| Model | Quantization | Size | Best Use Case |
| :--- | :--- | :--- | :--- |
| **Liquid AI LFM3 1.7B** | `Q4_K_M` | ~1.1 GB | Ultra-fast on-device reasoning and tool tasks |
| **NVIDIA Nemotron Labs Dory 1.0 4B** | `Q4_K_M` | ~2.0 GB | General conversation, drafting, and writing |
| **Qwen3 1.7B** | `Q4_K_M` | ~2.0 GB | Multilingual support, coding, and concise reasoning |
| **Qwen3.5 2B** | `Q8_0` | ~1.3 GB | Lightweight maximum throughput (>50 t/s) |
| **Spark X2.6 1.7B** | `Q3_K_M` | ~2.2 GB | STEM, math, and structured logic |

---

## Convenience Tip: Set Environment Variables Permanently

To avoid prepending `VK_ICD_FILENAMES` before every command, export it in your shell configuration:

```bash
echo 'export VK_ICD_FILENAMES=/opt/local/share/vulkan/icd.d/MoltenVK_icd.json' >> ~/.zshrc
source ~/.zshrc
```

Once exported, you can invoke `llama-cli` directly:

```bash
./build/bin/llama-cli -hf unsloth/Llama-3.2-3B-Instruct-GGUF:Q4_K_M -ngl 99 -c 4096 -fa 0
```

---

## Understanding GGUF: Why It Matters

**GGUF (GGML Unified Format)** is the binary format developed by the `llama.cpp` team to store and execute LLMs efficiently on consumer hardware.

Standard PyTorch checkpoints (`.pt`) or raw Hugging Face weights (`.safetensors`) cannot be run directly by native runtimes. GGUF solves four key operational challenges:

1. **Single-File Packaging:** Standard models split architecture definitions, tokenizer configs, vocabularies, and tensor weights across multiple files (`config.json`, `tokenizer.json`, weight shards). GGUF encapsulates all metadata, chat templates, and tensor data into a single `.gguf` binary.
2. **Native Quantization for Constrained VRAM:** Models typically release at 16-bit precision (FP16/BF16), requiring 6–8 GB of memory for even a 3B model. GGUF provides pre-quantized lower-precision representations (such as `Q4_K_M` or `Q5_K_M`), shrinking model size by 70–75% so that 3B parameter models comfortably fit inside 4 GB VRAM.
3. **Zero Python Overhead:** GGUF models are parsed directly by lightweight C/C++ runtimes without requiring PyTorch, CUDA, or Python environments.
4. **Direct Memory Mapping (`mmap`):** GGUF aligns binary tensors so the operating system can memory-map (`mmap`) weights from SSD directly into memory in seconds.

---

## Running as an OpenAI-Compatible API Server (`llama-server`)

If you want external applications, IDE extensions, or web interfaces to connect to your local model, use **`llama-server`** instead of the interactive terminal client (`llama-cli`).

`llama-server` provides an OpenAI-compatible HTTP interface exposing `/v1/chat/completions` and `/v1/models`.

### Launching the Server

From your `llama.cpp` repository directory:

```bash
VK_ICD_FILENAMES=/opt/local/share/vulkan/icd.d/MoltenVK_icd.json \
  ./build/bin/llama-server \
  -hf LiquidAI/LFM3-1.7B-GGUF:Q4_K_M \
  --alias lfm-1.7b \
  --host 127.0.0.1 \
  --port 8080 \
  -ngl 99 \
  -c 8192 \
  -fa 0 \
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
| **API Key** | Leave it blank |
| **Model Name** | `lfm-1.7b` (matching the `--alias` value passed to `llama-server`) |

### Common Client Examples

* **Web Frontends (Open WebUI, LibreChat, Chatbox):** Choose the OpenAI provider, point the endpoint to `http://127.0.0.1:8080/v1`, and set the model to `lfm-1.7b`.
* **AI Assistants (apps):** Configure a custom OpenAI provider with `http://127.0.0.1:8080/v1` as the base address.
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
  -hf LiquidAI/LFM3-1.7B-GGUF:Q4_K_M \
  --alias lfm-1.7b \
  --port 8080 \
  -ngl 99 -c 8192 -fa 0 > server.log 2>&1 &
```

When you are done, terminate the background process with:

```bash
killall llama-server
```

---

If you've managed to keep your older Mac out of retirement, you might want to check out my media downloader [YT Downloader](https://github.com/Shawshank01/yt-downloader-electron). It just got a major overhaul and now features a local or cloud AI assistant to make downloading, editing, and managing media completely hassle-free. Any and all feedback is welcome!

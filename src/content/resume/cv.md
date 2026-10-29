---
title: "Diwen Xiao's CV"
description: "A passionate Software Developer & Full-Stack Engineer, committed to building and architecting AI-driven, secure, scalable, and streamlined applications"
image: "/cv/persona.jpeg"
---

## Contact

📧 [lelouch@outlook.ie](mailto:lelouch@outlook.ie) | 📱 [087 693 0108](tel:+353876930108) | 📜 [Blog](https://michifumi.de) | 👨‍💼 [LinkedIn](https://www.linkedin.com/in/diwen-xiao-01a1172b0/)  
🌐 Languages: **Chinese** (Native), **English** (Fluent), **Japanese** (Intermediate)  
🪪 **Stamp 1G Visa Holder** (Immediate Full-Time Right to Work in Ireland🇮🇪 &bull; On-site, Hybrid & Remote &bull; Open to Relocation Nationwide)

---

## Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Languages** | TypeScript, JavaScript, Python, Bash / Shell Script, HTML, CSS, Java, C++ |
| **Frameworks & Runtimes** | React, Node.js, Express, FastAPI, Electron, Astro, Vite, Tailwind CSS |
| **AI & Natural Language Processing** | Open-source AI models (Hugging Face), ONNX, PySpark ML, Prompt Engineering & API Integration |
| **Data Engineering & Databases** | Apache Kafka, Apache Spark, Oracle 26ai, PostgreSQL, MongoDB, YugabyteDB |
| **DevOps & Cloud** | Linux, Docker, Docker Compose, CI/CD, Git, Vercel, Azure, AWS, GCP |
| **Networking & Security** | REST / JSON-RPC APIs, WebSockets, TLS, HTTP/2, OpenSSL |

---

## Education

### <img src="/cv/tu-dublin-logo.svg" style="height: 3rem; display: inline-block; vertical-align: middle; margin-right: 0.5rem; background-color: white; padding: 0.2rem; border-radius: 0.25rem;" alt="TU Dublin Logo" /> Master of Science - Technological University Dublin

<div style="display: flex; justify-content: space-between;"><strong>Computer Science (Advanced Software Development)</strong><span><em>2024 - 2026</em></span></div>

> Second Class Honours, First Division
>> **Modules:** Systems Architectures, Advanced Databases, Programming Paradigms, Software Design, Secure Systems Development, Web Applications Architectures, Data Management, Research Design, Scientific Research, Problem Solving

### <img src="/cv/nci-logo.png" style="height: 3rem; display: inline-block; vertical-align: middle; margin-right: 0.5rem; background-color: white; padding: 0.2rem; border-radius: 0.25rem;" alt="NCI Logo" /> Higher Diploma - National College of Ireland

<div style="display: flex; justify-content: space-between;"><strong>Science in Computing</strong><span><em>2023 - 2024</em></span></div>

> Second Class Honours, Grade One
>> **Modules:** Web Design and Client Side Scripting, Software Development, Databases, Object Oriented Software Engineering, Algorithms and Advanced Programming, Distributed Systems, Data Structures, Computer Architecture Operating Systems and Networks

---

## MSc Final Year Team Project <sup>as Team Leader</sup>

[Social Threat Guardian](https://github.com/Shawshank01/social-threat-guardian)

Architected and led the development of a real-time, multi-tier AI platform to detect, monitor, and visualise online toxicity and coordinated harassment campaigns across social networks. Engineered an end-to-end event-driven architecture featuring high-throughput Apache Kafka streaming, distributed PySpark and ONNX inference, and an Oracle Autonomous Database with full data lineage preservation. Orchestrated real-time WebSocket and Web Push (VAPID) notification services via Node.js/Express, delivering an interactive React/TypeScript dashboard continuously deployed to Vercel.

![Homepage0](/cv/UI-Walkthrough-00.jpeg)
Homepage Top

![Homepage1](/cv/UI-Walkthrough-01.jpeg)
Homepage Bottom

- **Agile Leadership & Sprint Cadence:** Served as Team Lead for 3 developers across weekly Agile/Scrum sprint cycles, facilitating sprint planning, daily stand-ups, backlog grooming, and retrospectives. Actively mediated technical friction across frontend, backend and data tiers, balancing task allocation to consistently deliver working increments on schedule.
- **Stakeholder Feedback & User-Centric Iteration:** Drove end-to-end user research by conducting target demographic surveys and designing interactive **Figma** prototypes. Executed usability testing and face-to-face pilot interviews, translating qualitative user feedback into prioritised product backlog features (e.g., customizable threat thresholds, keyword filters, and dark mode).
- **Decoupled System Architecture & Real-Time Services:** Designed a resilient, multi-tier architecture with clean interface contracts. Engineered an **Express/Node.js** backend integrating bidirectional **WebSockets** for live gauge telemetry and an automated background monitoring engine with intelligent cooldown throttling to prevent alert fatigue.
- **CI/CD Pipeline & Cloud Deployment:** Established production-like CI/CD workflows, deploying the **React, TypeScript, and Vite** frontend via **Vercel** with Git-driven automated builds and preview environments. Configured cloud infrastructure with environment isolation, CORS whitelisting, TLS/SSL termination, and secure Oracle Cloud Wallet credentials.
- **Distributed Data Pipeline & AI Inference:** Engineered an event-driven data pipeline using **Apache Kafka** and **PySpark Structured Streaming** to ingest live feeds from social media platforms. Executed distributed NLP inference using **Vectorized Pandas UDFs** and **ONNX Runtime** with a fine-tuned **DistilBERT** model, achieving over 85% threat classification accuracy.
- **Interactive Dashboards & Threat Visualisations:** Built real-time visual telemetry featuring an **ApexCharts**-powered Threat Index Gauge (live 5-zone hostility meter driven by **WebSockets**), a multi-resolution Threat Trend Chart (tracking minute, hourly, and daily toxicity surges), and interactive **Cytoscape.js** force-directed graphs to map user interaction and harassment dynamics.
- **Enterprise Security, RBAC & Data Lineage:** Implemented **JWT** authentication and **Bcrypt** hashing, established database **Role-Based Access Control (RBAC)** in Oracle 26ai, and enforced an audit-compliant data lineage model (retaining raw posts alongside inferences) to support GDPR compliance and traceability.

[Social Threat Guardian UI Walkthrough Video](https://youtu.be/svm_mfvKZiM)

---

## Personal Projects

[Signal Media Bot](https://github.com/Shawshank01/signal-media-bot)

- **Asynchronous Microservice Architecture:** Engineered an asynchronous microservice interfacing with Signal via signal-cli JSON-RPC, delivering platform media (YouTube, X, Bluesky, TikTok) as native playable attachments.
- **Adaptive Stream Multiplexer:** Built an adaptive FFmpeg / yt-dlp stream multiplexer that dynamically evaluates bitrates, prioritizes modern codecs (AV1/H.264/AAC), and downscales resolutions to strictly adhere to Signal’s 100 MB payload ceiling.
- **Concurrency & Webhook Optimization:** Optimized webhook throughput by offloading blocking CPU and disk I/O to worker threads (asyncio.to_thread), maintaining sub-50 ms webhook response times during active downloads.
- **Privacy Engine & Container Hardening:** Implemented a privacy engine that canonicalizes URLs and strips ad/analytics telemetry (utm_*, fbclid, si) while running in a hardened non-root **Docker** container (UID 10001).
- **Multi-Architecture CI/CD & Automation:** Built an end-to-end workflow using GitHub Actions and Docker Buildx that automatically builds and publishes multi-architecture images (linux/amd64, linux/arm64) to Docker Hub on every merge, paired with daily Dependabot scans to proactively patch upstream extractor dependencies.

![signal-security](/cv/signal-security.png)
Email Correspondence with [Signal Officials](https://support.signal.org/hc/en-us/articles/360007320791-How-can-I-report-a-security-vulnerability)

While developing the integration, I discovered and responsibly disclosed a confirmed security and UI-masking **0-day** vulnerability across official Signal clients (Desktop, Android, and iOS). I identified a protocol-to-UI disconnect where messages bundling an audio track with secondary binary files rendered only the audio waveform, completely concealing the secondary payload, while Desktop’s export handler silently dropped all bundled files onto the recipient’s local disk without visual indication. For example, the [installation package for my demo app](https://github.com/Shawshank01/test-apk/blob/main/public/android.mp4) can be downloaded silently to the local disk of an Android user's phone and installed easily. I conducted root-cause analysis isolating the discrepancy between the underlying Signal Protocol schema and client-side message renderers, verified behaviour across macOS, Android, and iOS with proof-of-concept exploits (uncovering additional media-parsing edge cases on iOS), and collaborated directly with Signal’s Security Team to validate the flaw.

---

[YT-DLP Downloader](https://github.com/Shawshank01/yt-downloader-electron)

![YT-DLP-UI](https://raw.githubusercontent.com/Shawshank01/yt-downloader-electron/main/public/YT-Downloader-UI.png)
YT-DLP Downloader UI

- **Cross-Platform Desktop Architecture:** Engineered a high-performance desktop media tool using Electron and Node.js interfacing with yt-dlp and FFmpeg across macOS, Windows, and Linux, distributed via DMGs, NSIS installers, and AppImages.
- **Hardware Acceleration & Media Pipeline:** Developed an automated video pipeline supporting Apple VideoToolbox (h264_videotoolbox/hevc_videotoolbox) with CPU fallbacks, platform-adaptive subtitle burn-in (libass) with OS-specific CJK font fallback, three-tier dynamic audio codec negotiation (aac_at -> libfdk_aac -> aac), and native MP4 container thumbnail embedding (attached_pic).
- **Hardened Process Management & IPC:** Architected a secure multi-process IPC model enforcing context isolation, command-injection prevention (CWE-78), mutual exclusion task locking, native process tree termination (taskkill /T /F on Windows, SIGKILL on POSIX), and automatic transactional temp-file cleanups.
- **Stream Processing & Environment Resolution:** Built a custom stream chunk-reassembly buffer (LineStreamFilter) with regex-based log suppression for real-time telemetry streaming; implemented automated multi-tier PATH synthesis and runtime dependency capability inspection across major package managers (Homebrew, MacPorts, WinGet, Scoop).
- **Authentication & Network Features:** Implemented multi-browser cookie extraction (Chrome, Firefox, Safari, Brave) with macOS Full Disk Access permission handling for authenticated media, and configurable SOCKS5 proxy routing for network restriction bypass.
- **Automated Multi-OS CI/CD Pipeline:** Built a multi-runner GitHub Actions release matrix targeting macOS, Windows, and Linux across x64 and ARM64 architectures; automated lint verification, build aggregation, PGP-sanitized release notes generation, and binary deployment to GitHub Releases and GitLab mirrors upon tag push.

---

[Proxy_sh](https://github.com/Shawshank01/proxy_sh)

- **Linux Infrastructure Automation:** Engineered a 4,400+ line automated Linux deployment and orchestration engine in Bash, provisioning hardened, containerised Xray (VLESS-XHTTP-REALITY) and Shadowsocks-rust (2022) services via Docker Compose across 6+ distributions (Debian, Ubuntu, RHEL, Fedora).
- **Cryptographic Validation & Network Defense:** Designed TLS 1.3 / HTTP/2 pre-flight domain validation and loopback fallback isolation (dokodemo-door routing to 127.0.0.1:10086) to neutralize active network probing, SNI spoofing, and DPI traffic fingerprinting.
- **Bandwidth Governance & Concurrency:** Built a multi-tenant bandwidth accounting engine querying Xray's gRPC telemetry API, enforcing per-user quotas and anniversary billing cycles via a low-overhead systemd daemon with re-entrant file locking and automated configuration rollbacks on failure.
- **Supply Chain Security & Lifecycle Automation:** Implemented a zero-trust self-updating pipeline with detached OpenSSL RSA signature verification and SHA256 integrity checks, supporting non-destructive user lifecycle provisioning and dual-stack IPv4/IPv6 networking.

---

[xAI-desktop](https://github.com/Shawshank01/xAI-desktop)

- **Full-Stack Architecture & Streaming:** Developed a responsive full-stack web application interfacing with xAI’s API to deliver real-time conversational AI and image generation. Engineered a high-performance Deno 2 backend leveraging native Web APIs (Deno.serve, ReadableStream) to proxy requests and stream token chunks with low latency.
- **Stateful Client & Security:** Implemented a lightweight Vanilla JavaScript frontend featuring live Markdown rendering sanitized against XSS attacks via DOMPurify, dynamic model switching (Grok reasoning vs. image generation), and multi-turn session persistence via sessionStorage.
- **UX & Reliability:** Designed an intuitive interface with automatic OS-adaptive dark mode theming and built an automated test suite (deno test) validating CORS preflights, error boundaries, and static routing.

---

## Work Experience

### International Trader - Shenzhen Zhaokang Investment Co., Ltd.

<div style="display: flex; justify-content: space-between;"><strong>Data, ERP & IT Operations</strong><span><em>2016 - 2022</em></span></div>

> Bridged global commercial trade operations across **Japan, Switzerland, Brazil, and Russia** with internal IT infrastructure for 6 years, managing enterprise ERP data workflows, automating large-scale trade data processing, and administering office network systems.

- **Trade Data Processing & ETL Automation:** Processed, cleaned, and reconciled large volumes of multi-currency international trade, customs, and logistics datasets. Transitioned legacy manual spreadsheet workflows into automated **Python** and **SQL** data-cleaning pipelines to eliminate formatting discrepancies and accelerate monthly financial reporting.

- **ERP Administration & Inventory Governance:** Managed end-to-end inventory lifecycles, SKU tracking, and supply-chain data synchronization within the enterprise **ERP system**. Configured custom database queries, validation rules, and automated data imports/exports to maintain real-time stock accuracy across global suppliers and warehouses.

- **Network & IT Infrastructure Management:** Served as the primary IT administrator for office network infrastructure, configuring and maintaining routers, switches, firewalls, VLANs, and secure VPN/proxy tunnels to ensure stable, low-latency international connectivity and reliable access to global trade platforms such as LME and Bloomberg.

- **Cross-Functional Stakeholder & Global Partner Coordination:** Directed multilingual commercial and operational communications with international counterparties across Japan, Switzerland, Brazil, and Russia, while acting as the internal technical liaison to software vendors to streamline ERP system workflows.

- **Key Achievement - Cross-Border Factory Relocation (Shenzhen to the Philippines):** Spearheaded the end-to-end project management and execution of a full-scale factory relocation from Shenzhen to the Philippines. Coordinated cross-border equipment logistics, customs compliance, and the seamless migration of ERP inventory ledgers, supply-chain workflows, and on-site IT/network connectivity to bring the overseas facility into full operational readiness on schedule.

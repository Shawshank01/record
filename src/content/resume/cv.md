---
title: "Diwen Xiao's CV"
description: "A passionate Software Engineer / Full-Stack Developer with a strong academic foundation in advanced software development and practical experience architecting modern, highly scalable full-stack applications"
---

## Contact

📧 [lelouch@outlook.ie](mailto:lelouch@outlook.ie) | 📞 [087 693 0108](tel:+353876930108) | 📜 [Blog](https://michifumi.de) | 🧑‍💻 [LinkedIn](https://www.linkedin.com/in/diwen-xiao-01a1172b0/)  
🌐 Languages: **Chinese** (Native), **English** (Fluent), **Japanese** (Intermediate)  
🪪 **Stamp 1G Visa Holder** (Full Right to Work in Ireland🇮🇪)

---

## Tech Stack

- **Languages:** TypeScript, JavaScript, Python, Java, Bash / Shell Script, HTML, CSS
- **Frameworks & Runtimes:** React, Node.js, Express, FastAPI, Electron, Astro, Vite, Tailwind CSS
- **Data Engineering & AI:** Apache Kafka, Apache Spark, ONNX Runtime, DistilBERT
- **Databases:** Oracle 23ai, PostgreSQL, MongoDB, YugabyteDB
- **DevOps & Cloud:** Linux, Docker, Docker Compose, CI/CD, Git, Vercel, Azure, AWS, GCP
- **Networking & Security:** REST / JSON-RPC APIs, WebSockets, TLS, HTTP/2, OpenSSL

---

## Education

### <img src="/cv/tu-dublin-logo.svg" style="height: 3rem; display: inline-block; vertical-align: middle; margin-right: 0.5rem; background-color: white; padding: 0.2rem; border-radius: 0.25rem;" alt="TU Dublin Logo" /> Master of Science - Technological University Dublin

<div style="display: flex; justify-content: space-between;"><strong>Computer Science (Advanced Software Development)</strong><span><em>2024 - 2026</em></span></div>

> Second Class Honours, First Division
>> **Module:** Systems Architectures, Advanced Databases, Programming Paradigms, Software Design, Secure Systems Development, Web Applications Architectures, Data Management, Research Design, Scientific Research, Problem Solving

### <img src="/cv/nci-logo.png" style="height: 3rem; display: inline-block; vertical-align: middle; margin-right: 0.5rem; background-color: white; padding: 0.2rem; border-radius: 0.25rem;" alt="NCI Logo" /> Higher Diploma - National College of Ireland

<div style="display: flex; justify-content: space-between;"><strong>Science in Computing</strong><span><em>2023 - 2024</em></span></div>

> Second Class Honours, Grade One
>> **Module:** Web Design and Client Side Scripting, Software Development, Databases, Object Oriented Software Engineering, Algorithms and Advanced Programming, Distributed Systems, Data Structures, Computer Architecture Operating Systems and Networks

---

## Final Year Team Project <sup>as Team Leader</sup>

[Social Threat Guardian](https://github.com/Shawshank01/social-threat-guardian)

Architected and led the development of a real-time, multi-tier AI platform to detect, monitor, and visualise online toxicity and coordinated harassment campaigns across decentralised social networks (Bluesky & Mastodon). Engineered an end-to-end event-driven architecture featuring high-throughput Apache Kafka streaming, distributed PySpark and ONNX inference, and an Oracle Autonomous Database with full data lineage preservation. Orchestrated real-time WebSocket and Web Push (VAPID) notification services via Node.js/Express, delivering an interactive React/TypeScript dashboard continuously deployed to Vercel.

![Homepage0](/cv/UI-Walkthrough-00.jpeg)
Homepage Top

![Homepage1](/cv/UI-Walkthrough-01.jpeg)
Homepage Bottom

- **Agile Leadership & Sprint Cadence:** Served as Team Lead for 3 developers across weekly Agile/Scrum sprint cycles—facilitating sprint planning, daily stand-ups, backlog grooming, and retrospectives. Actively mediated technical friction across frontend and data tiers, balancing task allocation to consistently deliver working increments on schedule.
- **Stakeholder Feedback & User-Centric Iteration:** Drove end-to-end user research by conducting target demographic surveys and designing interactive **Figma** prototypes. Executed usability testing and face-to-face pilot interviews, translating qualitative user feedback into prioritised product backlog features (e.g., customizable threat thresholds, keyword filters, and dark mode).
- **Decoupled System Architecture & Real-Time Services:** Designed a resilient, multi-tier architecture with clean interface contracts. Engineered an **Express/Node.js** backend integrating bidirectional **WebSockets** for live gauge telemetry and an automated background monitoring engine with intelligent cooldown throttling to prevent alert fatigue.
- **CI/CD Pipeline & Cloud Deployment:** Established production-like CI/CD workflows, deploying the **React, TypeScript, and Vite** frontend via **Vercel** with Git-driven automated builds and preview environments. Configured cloud infrastructure with environment isolation, CORS whitelisting, TLS/SSL termination, and secure Oracle Cloud Wallet credentials.
- **Distributed Data Pipeline & AI Inference:** Engineered an event-driven data pipeline using **Apache Kafka** and **PySpark Structured Streaming** to ingest live feeds from Bluesky and Mastodon. Executed distributed NLP inference using **Vectorized Pandas UDFs** and ONNX Runtime with a fine-tuned **DistilBERT** model, achieving over 85% threat classification accuracy.
- **Graph Analytics & Interactive Dashboards:** Developed complex, interactive data visualisations integrating **Cytoscape.js** (`cytoscape-fcose` force-directed layout) and the **Louvain** community detection algorithm to map coordinated harassment networks, complemented by **ApexCharts** for real-time sentiment trends.
- **Enterprise Security, RBAC & Data Lineage:** Implemented **JWT** authentication and **Bcrypt** hashing, established database **Role-Based Access Control (RBAC)** in Oracle 23ai, and enforced an audit-compliant **data lineage** model (retaining raw posts alongside inferences) to support GDPR compliance and traceability.

[Social Threat Guardian UI Walkthrough Video](https://youtu.be/svm_mfvKZiM)

---

## Personal Projects

[Signal Media Bot](https://github.com/Shawshank01/signal-media-bot)

**Signal Media Bot** is a containerised asynchronous Python microservice built with FastAPI, asyncio, and Docker that extracts, sanitizes, and delivers multimedia from platforms like YouTube and X directly into Signal chats as native playable attachments. Interfacing with Signal via JSON-RPC webhooks, the service features an automated URL privacy sanitizer and an adaptive FFmpeg / yt-dlp transcoding pipeline that dynamically downscales resolutions and multiplexes streams to guarantee compliance with Signal's strict 100 MB file limit.

While developing the integration, I discovered and responsibly disclosed a confirmed security and UI-masking vulnerability across official Signal clients (Desktop, Android, and iOS). I identified a protocol-to-UI disconnect where messages bundling an audio track with secondary binary files rendered only the audio waveform, completely concealing the secondary payload, while Desktop’s export handler silently dropped all bundled files onto the recipient’s local disk without visual indication. I conducted root-cause analysis isolating the discrepancy between the underlying Signal Protocol schema and client-side message renderers, verified behavior across macOS, Android, and iOS with proof-of-concept exploits (uncovering additional media-parsing edge cases on iOS), and collaborated directly with Signal’s Security Team to validate the flaw.

![signal-security](/cv/signal-security.png)
Email Correspondence with [Signal Officials](https://support.signal.org/hc/en-us/articles/360007320791-How-can-I-report-a-security-vulnerability)

---

[YT-DLP Downloader](https://github.com/Shawshank01/yt-downloader-electron)

![YT-DLP-UI](https://raw.githubusercontent.com/Shawshank01/yt-downloader-electron/main/public/YT-Downloader-UI.png)
YT-DLP Downloader UI

**YT Downloader Electron** is a cross-platform desktop application built with Electron and Node.js that interfaces with yt-dlp and FFmpeg to provide high-performance media downloading, transcoding, and subtitle processing. The application features hardware-accelerated video encoding (H.264/HEVC), platform-adaptive subtitle burn-in (libass), dynamic audio codec negotiation, and native container thumbnail embedding. Built around a secure IPC architecture with custom child process management, it delivers real-time download/transcode progress streaming, atomic task cancellation, multi-browser cookie authentication, configurable SOCKS5 proxy routing, and automated system dependency resolution across macOS, Windows, and Linux.

---

[Proxy_sh](https://github.com/Shawshank01/proxy_sh)

**proxy_sh** is an automated Linux infrastructure and proxy orchestration tool built in Bash that provisions, hardens, and manages containerised Xray (VLESS-XHTTP-REALITY) and Shadowsocks-rust (2022) services via Docker and Docker Compose. It features automated cross-distribution environment setup, TLS 1.3/HTTP-2 pre-flight domain validation, and loopback fallback hardening to resist active network probing and traffic hijacking. The tool implements a multi-tenant bandwidth governance engine that interfaces with Xray’s internal stats API to enforce per-user data quotas and anniversary billing cycles through automated systemd timers or cron jobs. It incorporates OpenSSL cryptographic signature verification for secure self-updates, non-destructive user lifecycle management, and dynamic configuration generation across dual-stack IPv4/IPv6 networks.

---

[xAI-desktop](https://github.com/Shawshank01/xAI-desktop)

**xAI Desktop** is a responsive full-stack web application interfacing with xAI’s API to deliver real-time conversational AI and image generation. Engineered a Node.js/Express backend to proxy API requests and stream chunked responses, paired with a lightweight Vanilla JavaScript frontend featuring live Markdown rendering, multi-turn session context preservation, dynamic model switching across Grok reasoning and image-generation models, and system-adaptive dark mode theming.

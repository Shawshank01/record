---
title: "Diwen Xiao's CV"
description: "My experiences and projects"
---

## Contact

📧 [EMAIL](mailto:lelouch@outlook.ie) | 🧑‍💻 [LinkedIn](https://www.linkedin.com/in/diwen-xiao-01a1172b0/)  
🪪 **Stamp 1G Visa Holder** (Full Right to Work in Ireland)

---

A passionate **Software Engineer / Full-Stack Developer** with a strong academic foundation in advanced software development and practical experience architecting modern, highly scalable full-stack applications.

---

## Tech Stack

- **Languages:** TypeScript, JavaScript, Python, Java, Bash / Shell Script, HTML5, CSS3
- **Frameworks & Runtimes:** React, Node.js, Express, FastAPI, Electron, Astro, Vite, Tailwind CSS
- **Data Engineering & AI:** Apache Kafka, Apache Spark, ONNX Runtime, DistilBERT
- **Databases:** Oracle 23ai, PostgreSQL, MongoDB, YugabyteDB
- **DevOps & Cloud:** Docker, Docker Compose, CI/CD (GitHub Actions), Git, Linux, Vercel, AWS, GCP, Azure
- **Networking & Security:** REST / JSON-RPC APIs, WebSockets, TLS 1.3, HTTP/2, OpenSSL

---

## Education

### <img src="/cv/tu-dublin-logo.svg" style="height: 3rem; display: inline-block; vertical-align: middle; margin-right: 0.5rem; background-color: white; padding: 0.2rem; border-radius: 0.25rem;" alt="TU Dublin Logo" /> Master of Science - Technological University Dublin

<div style="display: flex; justify-content: space-between;"><strong>Computer Science (Advanced Software Development)</strong><span><em>2024 - 2026</em></span></div>

> Second Class Honours, First Division
>> **Module:** Systems Architectures, Advanced Databases, Programming Paradigms, Software Design, Secure Systems Development, Web Applications Architectures, Data Management, Research Design, Scientific Research, Problem Solving

### <img src="/cv/nci-logo.png" style="height: 3rem; display: inline-block; vertical-align: middle; margin-right: 0.5rem; background-color: white; padding: 0.2rem; border-radius: 0.25rem;" alt="NCI Logo" /> Higher Diploma - National College of Ireland

<div style="display: flex; justify-content: space-between;"><strong>Science in Computing</strong><span><em>2023 - 2024</em></span></div>

> 2nd Class Honours Grade 1
>> **Module:** Web Design and Client Side Scripting, Software Development, Databases, Object Oriented Software Engineering, Algorithms and Advanced Programming, Distributed Systems, Data Structures, Computer Architecture Operating Systems and Networks

---

## Group Project <sup>as Team Leader</sup>

[Social Threat Guardian](https://github.com/Shawshank01/social-threat-guardian)

This is a real-time AI platform to detect, monitor, and visualise online toxicity and coordinated harassment campaigns across social networks. Built a high-throughput streaming pipeline using Apache Kafka, PySpark Structured Streaming, and Delta Lake, executing distributed inference with a fine-tuned DistilBERT NLP model optimized via ONNX Runtime for low-latency threat classification. Persisted enriched telemetry into an Oracle Autonomous Database, orchestrated real-time alerts and WebSocket feeds via Node.js/Express, and delivered an interactive React/TypeScript dashboard featuring dynamic sentiment indices and graph-based harassment network mapping.

![Homepage0](/cv/UI-Walkthrough-00.jpeg)
Homepage Top

![Homepage1](/cv/UI-Walkthrough-01.jpeg)
Homepage Bottom

- Acted as Team Leader, coordinating a group of 3 developers using Agile methodologies (Scrum) to build an AI-powered platform for detecting and monitoring online harassment networks in real time.
- Designed a survey questionnaire, and based on the feedback received, user interface mock-ups were created and refined using **Figma**.
- Architected a high-performance Full-Stack application, utilising **React, TypeScript, Tailwind CSS, and Vite** for a highly visual frontend, alongside an **Express/Node.js** backend utilising WebSockets for sub-second real-time threat alerts.
- Engineered a scalable Data Pipeline, employing **Apache Kafka and Spark** to ingest and stream live event data from social media APIs (e.g., Bluesky) for continuous downstream analysis.
- Integrated advanced NLP model **DistilBERT** and leveraged an **Oracle 23ai Database** for in-database machine learning, achieving over 85% accuracy in threat classification, sentiment analysis, and entity recognition.
- Developed complex, interactive data visualisations, integrating **Cytoscape** and **Louvain** community detection algorithms to map coordinated harassment networks, empowering security analysts to identify emerging threats.
- Designed intuitive dashboard analytics using **ApexCharts** to deliver a global threat index and sentiment history, translating complex AI insights into accessible UI components for end-users.
- Implemented secure user workflows utilising **JSON Web Tokens (JWT)** and **Bcrypt**, managing customisable keyword tracking, real-time alert preferences, and GDPR-compliant data handling.
- Conducted a pilot test of the early version with a small group of users from different demographics and carried out face-to-face interviews to gather feedback on their user experience, with a view to improving the platform.

[Social Threat Guardian UI Walkthrough Video](https://ody.sh/hakpyXqP8L)

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

---
Thank you for visiting😃  
You are most welcome to explore my [blog homepage](https://zaku.eu.org/) to find more things that might interest you.

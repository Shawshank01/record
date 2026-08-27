---
title: "twitter.now: Score, Don't Ban"
description: "How twitter.now shifts content moderation from bans to AI scoring, and why it feels so familiar."
pubDate: 2026-08-27
tags:
  - Social Media
  - AI
  - Opinion
  - Product Design
---

You might have noticed the recent buzz around [twitter.now](https://twitter.now/). It almost feels like a Reanimation Jutsu, bringing the iconic blue bird back into the spotlight.

![jxl hint](/2026-08-27/twitter-now-landing-page.jxl)
*The landing page of twitter.now reviving the iconic blue bird aesthetic*

Beyond the legal drama and trademark disputes with Elon Musk, launching "just another microblogging platform" is rarely game-changing. What genuinely caught my eye is their fundamental shift in content governance philosophy:

> **Instead of deleting posts or banning accounts, they score them.**

Through their VERA and Trust OS ([powered by Gemini](https://finance.biggo.com/news/d1bdbb1d-0309-4fa3-b7c1-e43513240236)), posts receive credibility and trust scores. Users simply adjust a dynamic slider to set their own threshold for what content reaches their feed.

![jxl hint](/2026-08-27/twitter-now-vera.jxl)
*VERA & Trust OS dynamic trust scoring and slider controls*

Seeing twitter.now's architecture instantly brought back memories of my Master's final project, [**Social Threat Guardian**](https://github.com/Shawshank01/social-threat-guardian) (built with React, TypeScript, Express, Oracle DB, and DistilBERT, though models like DeBERTa-v3 or RoBERTa would be the go-to today). While the use cases differ, the core philosophy is strikingly aligned: both use continuous AI-driven 0–100 scoring, putting control and visibility into data-backed thresholds.

The difference lies in where the engine lives:

- **twitter.now** is a native social platform where higher scores mean higher trust for feed curation.
- **Social Threat Guardian** was an external intelligence and alerting engine. It ingested posts across major platforms, scored them on a 0–100 toxicity scale (where higher = more dangerous), mapped historical platform-wide threat trends, and triggered instant alerts when high-risk content matched user-defined keywords, like real names, identities, or location data.

Back then, our biggest hurdles were the astronomical cost of fetching streaming data (X's API pricing felt like robbery), and feedback from one of my mentors pointing out that our project had a blurry target audience, making it hard for everyday users to grasp the value of a standalone monitoring dashboard.

Seeing twitter.now, I can’t help but marvel at how it has directly resolved the two biggest problems we faced back then, by building the platform itself instead of paying for external APIs, and tying the scoring engine directly into the core product to make it easier for users to understand.

Perhaps that is why they have the confidence to take Musk to court and launch a \$20/\$40 subscription plan, whilst we ultimately never got beyond the stage of a final project.

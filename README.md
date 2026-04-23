# Michifumi's Blog

A personal blog built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com), and TypeScript. Designed as a fast, fully static site with a dark-mode aesthetic, deployed to GitHub Pages.

**Live site:** [zaku.eu.org](https://zaku.eu.org)

## Features

### Content & Authoring

- **Markdown blog posts** — Write posts in `.md` files with typed frontmatter (title, description, date, tags, draft status, update date).
- **Draft support** — Set `draft: true` in frontmatter to hide a post from production without deleting it.
- **Tag system** — Every post requires at least one tag. Tags are aggregated automatically and shown in a filterable sidebar.
- **Language switcher** — Embed bilingual content blocks within a post; readers toggle between languages with a single click.
- **Randomised header subtitle** — A curated list of quotes is randomly displayed beneath the site title on each page load.
- **Giscus comments** — GitHub Discussions-powered comment system on every blog post, with reactions, lazy loading, and strict discussion matching.

### Discovery & Navigation

- **Full-text search** — A client-side search bar filters posts by title, description, body, and tags instantly — no server required.
- **Tag filtering sidebar** — Desktop users see a sticky sidebar of all tags; clicking one or more tags filters the post list in real time. Mobile users get a collapsible tag menu.
- **Back-to-top button** — A floating button appears on scroll and smoothly returns users to the top of the page. Respects `prefers-reduced-motion`.
- **Auto-hiding header** — The fixed header slides out of view on scroll to maximise reading space.

### Reading Experience

- **Image lightbox** — Click any image inside a blog post to view it full-screen in a lightbox overlay. Press `Escape` or click to dismiss.
- **Code block copy button** — Every `<pre>` code block gets a one-click copy button with visual feedback (copied ✓ / failed ✗).
- **Beautiful code typography** — Code snippets and `<pre>` blocks are styling using a self-hosted [Google Sans Code](https://github.com/googlefonts/googlesans-code) variable font.
- **External link handling** — Links to external domains automatically open in a new tab with `rel="noopener"`.
- **Responsive layout** — Sidebar + content grid on desktop, single-column on mobile, with a dedicated mobile tag toggle.

### SEO & Feeds

- **RSS feed** — Auto-generated at `/rss.xml` from all published posts. The footer RSS button copies the feed URL to clipboard.
- **XML sitemap** — Auto-generated at `/sitemap.xml` with `<lastmod>` using each post's update date (or publish date).
- **robots.txt** — Dynamically generated, pointing crawlers to the sitemap.
- **JSON-LD structured data** — `BlogPosting` schema markup is injected into every post page for rich search results.
- **Open Graph & Twitter cards** — Full social-media meta tags on every page.
- **Canonical URLs** — Every page includes a `<link rel="canonical">` tag.
- **Comprehensive favicons** — PNG, SVG, Apple Touch Icon, and `favicon.ico` for maximum compatibility across browsers and RSS clients.

### Analytics & Infrastructure

- **Self-hosted analytics** — Lightweight, privacy-respecting pageview tracking via `navigator.sendBeacon` to a self-hosted endpoint. No cookies, no third-party scripts.
- **GitHub Pages deployment** — Ships with a GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated builds and deploys on push.
- **Content Security Policy** — A strict CSP meta tag is applied site-wide.

## Tech Stack

| Layer       | Technology                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| Framework   | [Astro 6](https://astro.build) (static-site generation)                    |
| Styling     | [Tailwind CSS 4](https://tailwindcss.com) + `@tailwindcss/typography`      |
| Typography  | [Inter](https://fonts.google.com/specimen/Inter), [Uncial Antiqua](https://fonts.google.com/specimen/Uncial+Antiqua) via Google Fonts, and self-hosted [Google Sans Code](https://github.com/googlefonts/googlesans-code) |
| Language    | TypeScript                                                                 |
| Deployment  | GitHub Pages via GitHub Actions                                            |

## Using This Repository as a Template

### Prerequisites

- **Node.js** ≥ 22
- **npm** (included with Node.js)

### 1. Clone & Install

```bash
git clone https://github.com/Shawshank01/record.git
cd record
npm install
```

### 2. Personalise

Update the following to make the blog your own:

| What                    | Where                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| Site URL                | `astro.config.mjs` → `site`                                        |
| Blog title & meta       | `src/layouts/BaseLayout.astro` → default props                     |
| Header subtitles        | `src/data/subtitles.ts`                                            |
| Custom domain (CNAME)   | `CNAME` (delete if not using a custom domain)                      |
| Analytics endpoint      | `src/scripts/analytics.ts` → `endpoint` (or remove the script)     |
| Accent colour           | `src/styles/global.css` → `@theme` block                           |
| Background colours      | `src/styles/global.css` → `@theme` block                           |
| Social / OG image       | `public/icon.svg` (replace with your own)                          |
| Giscus comments         | `src/pages/blog/[slug].astro` → giscus `data-repo` and IDs         |
| Giscus config           | `giscus.json` → origins, comment order                             |

### 3. Write a Post

Create a new `.md` file in `src/content/blog/`:

```markdown
---
title: "My First Post"
description: "A short summary of the post."
pubDate: 2025-01-01
tags: ["Example"]
---

Write your content here in Markdown.
```

**Frontmatter fields:**

| Field         | Required | Description                                        |
| ------------- | -------- | -------------------------------------------------- |
| `title`       | ✅        | Post title                                         |
| `description` | ✅        | Short summary shown on cards and in meta tags      |
| `pubDate`     | ✅        | Publication date (`YYYY-MM-DD`)                    |
| `tags`        | ✅        | Array of tag strings (at least one)                |
| `draft`       | ❌        | Set to `true` to hide the post from production     |
| `updateDate`  | ❌        | Last-updated date, used in sitemap and post header |

### 4. Develop Locally

```bash
npm run dev
```

The dev server starts at `http://localhost:4321` with hot reload.

### 5. Build & Preview

```bash
npm run build      # Generate static files in dist/
npm run preview    # Preview the production build locally
```

### 6. Deploy

The included GitHub Actions workflow automatically builds and deploys to GitHub Pages on every push to the default branch. To use it:

1. Go to your repository **Settings → Pages**.
2. Set the source to **GitHub Actions**.
3. Push to the default branch — the workflow handles the rest.

## Licenses

[MIT](https://opensource.org/license/mit)  
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)

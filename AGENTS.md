# Agent Guidelines for Michifumi's Blog

This document provides context, conventions, and rules for AI assistants (Antigravity, Codex, Claude Code, GitHub Copilot, Cursor, etc.) working in this repository.

---

## 1. Project Overview & Tech Stack

A personal static blog and portfolio website deployed to GitHub Pages at [michifumi.de](https://michifumi.de).

- **Framework**: [Astro 7](https://astro.build) (SSG mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` and `@tailwindcss/typography`
- **Language**: TypeScript (`strict` mode enabled in `tsconfig.json`)
- **Markdown Processing**: `@astrojs/markdown-remark` with `remark-github-blockquote-alert` and custom `./remark-jxl-hint.mjs`
- **Comments**: Giscus (GitHub Discussions backend, configured in `giscus.json`)
- **Search & Client Scripts**: Vanilla TypeScript modules in `src/scripts/`

---

## 2. Directory Structure

```text
├── .github/
│   └── workflows/deploy.yml       # GitHub Pages deployment workflow
├── dist/                          # Generated production build (do not edit directly)
├── public/                        # Static assets (favicons, self-hosted fonts, YYYY-MM-DD/ post media, standalone HTML CVs)
├── scripts/
│   └── check-title-length.mjs     # SEO pre-check for post title (≤ 70 chars) and description (25–160 chars)
├── src/
│   ├── components/                # Astro UI components (Header, Footer, PostCard, TagSidebar, etc.)
│   ├── content/
│   │   ├── blog/                  # Blog post Markdown files (*.md)
│   │   └── resume/                # Resume / CV Markdown files
│   ├── content.config.ts          # Astro content collections schema definition
│   ├── data/                      # Static data (e.g. randomised header subtitles)
│   ├── layouts/
│   │   └── BaseLayout.astro       # Root layout containing SEO, OpenGraph, JSON-LD, fonts, and scripts
│   ├── pages/                     # Astro file-based routing
│   │   ├── 404.astro              # Custom 404 Not Found error page
│   │   ├── blog/[slug].astro      # Individual blog post pages
│   │   ├── resume/[slug].astro    # Resume pages
│   │   ├── index.astro            # Homepage (post list + tag filter)
│   │   ├── robots.txt.ts          # Dynamic robots.txt endpoint
│   │   ├── rss.xml.ts             # RSS feed generator
│   │   └── sitemap.xml.ts         # Sitemap generator with <lastmod>
│   ├── scripts/                   # Client-side scripts
│   │   ├── analytics.ts           # Lightweight self-hosted pageview tracking
│   │   ├── back-to-top.ts         # Smooth scroll-to-top button
│   │   ├── code-copy.ts           # Code block copy button with visual feedback
│   │   ├── external-links.ts      # Open external links in new tab
│   │   ├── lang-switcher.ts       # Post language switcher toggle
│   │   ├── lightbox.ts            # Image lightbox overlay
│   │   ├── search.ts              # Client-side full-text search
│   │   └── toc.ts                 # Table of contents scroll spy and mobile disclosure
│   ├── styles/                    # Global stylesheets
│   │   └── global.css             # Tailwind CSS v4, @theme design tokens, font definitions
│   └── env.d.ts                   # TypeScript environment types declaration
├── AGENTS.md                      # Universal AI instructions (this file)
├── CLAUDE.md                      # Symlink to AGENTS.md for Claude Code
├── astro.config.mjs               # Astro configuration
├── giscus.json                    # Giscus comment system configuration
├── package.json
├── remark-jxl-hint.mjs            # Remark plugin for JPEG XL hints
└── tsconfig.json
```

---

## 3. Common Development Commands

- `pnpm dev`: Run `predev` check (`check-title-length.mjs`) and start local development server (`http://localhost:4321`)
- `pnpm build`: Run `prebuild` check (`check-title-length.mjs`) and build the static site into `dist/`
- `pnpm preview`: Preview the production build locally
- `node scripts/check-title-length.mjs`: Manually run the post title and description length validator

> [!NOTE]
> `@astrojs/check` is not installed in this repository, so `pnpm build` is the canonical end-to-end verification command after code or content changes (covering `check-title-length.mjs`, Zod content collection schemas, RSS `sanitize-html` rendering, and Vite/Rolldown bundling).

---

## 4. Content Authoring Guidelines

### Blog Posts (`src/content/blog/`)

- Filename format: `YYYY-MM-DD-kebab-case-title.md`
- Frontmatter schema (defined in `src/content.config.ts`):

  ```yaml
  ---
  title: "Clear, Concise Title"
  description: "Short summary for SEO and cards"
  pubDate: 2026-01-01
  tags: ["Tech", "Linux"]       # Non-empty array of strings
  draft: false                  # Optional; hides post from production when true
  updateDate: 2026-01-02        # Optional; updates sitemap <lastmod>
  ---
  ```

- **Title & Description Length Limits**: Keep the total rendered title (`title + " · Michifumi's Blog"`) at **70 characters or fewer** and `description` between **25 and 160 characters** to pass `scripts/check-title-length.mjs` and optimize search engine snippets.
- **Post Media**: Store post images and media in `public/YYYY-MM-DD/<filename>` and reference them as `/YYYY-MM-DD/<filename>` (do not place post media in `src/assets/`).
- **Spelling**: Use **British English** (`normalise`, `centre`, `customised`, `civilisation`) across UI copy and English prose.
- **Alerts**: Use GitHub-style blockquote alerts (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`).

### Resume / CV Files

- This repository contains two separate CV formats: the Astro Markdown collection entry (`src/content/resume/cv.md`, rendered at `/resume/cv/` with `noindex`) and standalone HTML CVs in `public/` (`public/cv.html`, `public/cv-*.html`).
- Always confirm which target(s) to update when asked to edit the CV or resume.

### Markdown & Linting Standards (`markdownlint`)

All generated or edited Markdown files (`*.md`) must strictly adhere to [markdownlint rules](https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md):

- **MD001 / MD003**: Heading levels must increment by only one level at a time (e.g. `##` → `###`, never skipping levels). Use ATX style (`## Heading`).
- **MD009 / MD010**: No trailing spaces; use spaces for indentation instead of hard tabs.
- **MD022 / MD031 / MD032**: Blank lines required before and after headings, fenced code blocks, and lists.
- **MD025**: Single top-level heading. In blog posts, frontmatter provides the `title`, so body content should begin with `##` (level 2).
- **MD034**: No bare URLs — wrap them in `<https://...>` or `[label](https://...)`.
- **MD040**: Fenced code blocks must always specify a language identifier (e.g. ```` ```bash ````, ```` ```ts ````, ```` ```text ````).
- **MD045**: Images must always include descriptive alt text.

### Custom Markdown & Presentation Features

1. **Bilingual Post Toggle (`src/scripts/lang-switcher.ts`)**:
   - Structure bilingual sections using `## English` and `## 中文` headings:

     ````markdown
     ## English

     English content goes here.

     ## 中文

     中文内容写在这里。

     ---
     ````

   - The client-side script removes the headings and creates an interactive toggle button.
   - End the bilingual block with a horizontal rule (`---`) if followed by shared content.

2. **JPEG XL Image Hints (`remark-jxl-hint.mjs`)**:
   - For `.jxl` images, use `jxl hint` as the exact alt text:

     ```markdown
     ![jxl hint](/path/to/image.jxl)
     ```

   - The Remark plugin converts this into a link with fallback advice pointing to the JPEG XL blog post.

3. **Automatic Image & Caption Centering (`src/styles/global.css`)**:
   - Images and text lines directly below an image in the same block are automatically centered via `.prose p:has(img)`.
   - Do not inject manual `<center>` or `<div align="center">` tags into Markdown files.

---

## 5. Coding & Architecture Rules

1. **Static First**: Keep the site fast and lightweight. Do not introduce heavy runtime JavaScript libraries or client-side frameworks when vanilla TypeScript or CSS can do the job.
2. **Type Safety**: Strictly adhere to TypeScript types. Avoid `any` types wherever possible.
3. **Styling**: The site is intentionally **dark-only** (`<html class="dark">` in `src/layouts/BaseLayout.astro`; `color-scheme: dark` and `@theme` tokens `--color-surface`, `--color-soft`, and `--color-accent` in `src/styles/global.css`). Use Tailwind CSS utility classes and existing design tokens directly rather than adding `dark:` variants or light-theme styles.
4. **Never Edit `dist/` Directly**: The `dist/` folder is build-generated and overwritten by `pnpm build`. Always make modifications in `src/`, `public/`, or `scripts/`.
5. **Preserve Existing Functionality**: Take care not to break client-side enhancements (code copy buttons, image lightbox, tag filtering, language switcher, Table of Contents, scroll-to-top button, or Giscus comments). The scroll-to-top button in `src/layouts/BaseLayout.astro` intentionally uses `[data-header-jump]` with `"Jump to start"` / `"Jump to start of page"` labels — do not rename it to `data-back-to-top`, `"Back to top"`, or `"Scroll to top"`, as ad/annoyance-blocker cosmetic rules target those selectors.
6. **Content Security Policy & Self-Hosted Assets**: `src/layouts/BaseLayout.astro` enforces a strict `<meta http-equiv="Content-Security-Policy">` (`default-src 'self'`, `font-src 'self'`, and explicit `script-src` / `img-src` / `connect-src` / `frame-src` allowlists), and all fonts are self-hosted under `public/fonts/`. Do not introduce external CDN stylesheets, third-party fonts, or unallowlisted remote origins without updating the CSP.

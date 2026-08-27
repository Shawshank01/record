import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import tailwindcss from "@tailwindcss/vite";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkJxlHint from "./remark-jxl-hint.mjs";

export default defineConfig({
  site: "https://zaku.eu.org",

  markdown: {
    processor: unified({
      remarkPlugins: [remarkAlert, remarkJxlHint],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
  },
});

import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import remarkJxlHint from "./remark-jxl-hint.mjs";

export default defineConfig({
  site: "https://zaku.eu.org",

  markdown: {
    processor: unified({
      remarkPlugins: [remarkJxlHint],
    }),
  },
});

import { defineConfig } from "astro/config";
import remarkJxlHint from "./remark-jxl-hint.mjs";

export default defineConfig({
  site: "https://zaku.eu.org",

  markdown: {
    remarkPlugins: [remarkJxlHint],
  },
});

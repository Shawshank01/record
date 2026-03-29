import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import remarkJxlHint from './remark-jxl-hint.mjs';

export default defineConfig({
  site: 'https://zaku.eu.org',
  integrations: [
    tailwind({
      config: {
        applyBaseStyles: false
      }
    })
  ],
  markdown: {
    remarkPlugins: [remarkJxlHint]
  }
});

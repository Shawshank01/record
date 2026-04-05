import { defineConfig } from 'astro/config';
import remarkJxlHint from './remark-jxl-hint.mjs';

export default defineConfig({
  site: 'https://zaku.eu.org',

  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (
            warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
            warning.message.includes('@astrojs/internal-helpers')
          ) {
            return;
          }
          warn(warning);
        }
      }
    }
  },
  markdown: {
    remarkPlugins: [remarkJxlHint]
  }
});

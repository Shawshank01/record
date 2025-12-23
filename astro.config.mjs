import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://zaku.eu.org',
  integrations: [
    tailwind({
      config: {
        applyBaseStyles: false
      }
    })
  ]
});

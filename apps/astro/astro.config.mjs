import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://divcalc.xyz',
  output: 'static',
  trailingSlash: 'never',
  build: {
    assets: '_astro',
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    routing: {
      prefixDefaultLocale: false, // EN на /, RU на /ru/
    },
  },
  integrations: [
    svelte({ extensions: ['.svelte'] }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en-US', ru: 'ru-RU' },
      },
      entryLimit: 45000,
      changefreq: 'weekly',
      serialize(item) {
        item.lastmod = process.env.LAST_MOD ?? new Date().toISOString();
        return item;
      },
    }),
  ],
});

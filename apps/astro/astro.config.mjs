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
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    svelte({ extensions: ['.svelte'] }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          ru: 'ru-RU',
        },
      },
      entryLimit: 45000,
      filter: (page) => !page.includes('/spa/') && !page.includes('/api/'),
      serialize(item) {
        item.lastmod = process.env.LAST_MOD ?? new Date().toISOString();
        const url = item.url;
        if (url === 'https://divcalc.xyz/' || url === 'https://divcalc.xyz/ru/') {
          item.changefreq = 'daily';
          item.priority = 1.0;
        } else if (/\/(weapons|sets|brands|builds)\/$/.test(url)) {
          item.changefreq = 'weekly';
          item.priority = 0.9;
        } else if (/\/(weapons|sets|brands)\//.test(url)) {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        } else if (/\/builds\//.test(url)) {
          item.changefreq = 'weekly';
          item.priority = 0.7;
        } else {
          item.changefreq = 'monthly';
          item.priority = 0.5;
        }
        return item;
      },
    }),
  ],
});

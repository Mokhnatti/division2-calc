import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  define: {
    __BUILD_TS__: JSON.stringify(Date.now().toString()),
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'divcalc-data' },
          },
          {
            urlPattern: /\/locales\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'divcalc-locales' },
          },
        ],
      },
      manifest: {
        name: 'divcalc.xyz — Division 2 build calculator',
        short_name: 'divcalc',
        theme_color: '#0b0b0b',
        background_color: '#0b0b0b',
        display: 'standalone',
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});

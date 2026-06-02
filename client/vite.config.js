import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = parseInt(env.VITE_PORT) || 5173

  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'prompt',
        devOptions: {
          enabled: true,
          type: 'module'
        },
        includeAssets: ['favicon.ico', 'icons/*.png'],
        manifest: {
          name: 'Don Yeyo SHIGMA',
          short_name: 'DY Shigma',
          description: 'Sistema interno de Seguridad, Higiene y Medioambiente de Don Yeyo',
          theme_color: '#ffffffff',
          background_color: '#ffffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          lang: 'es',
          orientation: 'portrait-primary',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    server: {
      port,
    },
  }
})

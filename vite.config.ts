import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyPath = `${env.BASE_URL || ''}/api`
  return {
    base: '/elephant',
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: './node_modules/@ttab/elephant-ui/dist/styles/**/*.{woff,woff2}',
            dest: './assets'
          }
        ]
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        [proxyPath]: {
          target: `http://${env.HOST}:${env.PORT}`,
          changeOrigin: true,
          secure: false
        }
      },
      cors: { origin: '*' }
    }
  }
})

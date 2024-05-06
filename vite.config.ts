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
        '@/components': path.resolve(__dirname, './src/components'),
        '@/views': path.resolve(__dirname, './src/views'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/contexts': path.resolve(__dirname, './src/contexts'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/navigation': path.resolve(__dirname, './src/navigation'),
        '@/defaults': path.resolve(__dirname, './src/defaults'),
        '@/protos': path.resolve(__dirname, './shared/protos'),
        '@/shared': path.resolve(__dirname, './shared')
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

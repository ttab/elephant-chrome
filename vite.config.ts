import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    port: 5173,
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
    define: {
      'process.env.NEXTAUTH_URL': env.AUTH_URL
    },
    server: {
      hmr: {
        port: 5183
      },
      watch: {
        awaitWriteFinish: true
      }
    }
  }
})

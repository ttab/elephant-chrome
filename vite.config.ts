/// <reference types="vitest" />
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '')
  const env = { ...fileEnv, ...process.env } as Record<string, string | undefined>

  const parsePort = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }

  const devServerPort = parsePort(env.VITE_DEV_SERVER_PORT, 5173)
  const devHmrPort = parsePort(env.VITE_HMR_PORT, 5183)
  const BASE_URL = env.BASE_URL || '/elephant'
  const SYSTEM_LANGUAGE = env.SYSTEM_LANGUAGE || 'sv-se'

  return {
    port: devServerPort,
    base: BASE_URL,
    plugins: [
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@/modules': path.resolve(__dirname, './src/modules'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/views': path.resolve(__dirname, './src/views'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/contexts': path.resolve(__dirname, './src/contexts'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/navigation': path.resolve(__dirname, './src/navigation'),
        '@/defaults': path.resolve(__dirname, './src/defaults'),
        '@/shared': path.resolve(__dirname, './shared')
      },
      dedupe: [
        'react',
        'react-dom',
        'slate',
        'slate-react',
        'slate-history',
        '@slate-yjs/core',
        '@slate-yjs/react',
        'yjs'
      ]
    },
    define: {
      'process.env': JSON.stringify({
        NODE_ENV: mode,
        BASE_URL: BASE_URL,
        SYSTEM_LANGUAGE: SYSTEM_LANGUAGE
      })
    },
    server: {
      hmr: {
        port: devHmrPort
      },
      watch: {
        awaitWriteFinish: true
      }
    },
    preview: {
      port: devServerPort
    },
    optimizeDeps: {
      include: ['date-fns']
    },
    test: {
      env,
      include: ['__tests__/**/*.test.ts(x)?'],
      deps: {
        optimizer: {
          web: {
            include: ['date-fns']
          }
        }
      },
      globals: true,
      setupFiles: ['./setupTests.ts'],
      environment: 'jsdom',
      server: {
        deps: {
          inline: ['@ttab/elephant-ui']
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            slate: ['slate', 'slate-react', 'slate-history'],
            yjs: ['yjs', 'y-indexeddb', '@slate-yjs/core', '@slate-yjs/react'],
            tt: ['@ttab/elephant-ui', '@ttab/api-client'],
            textbit: ['@ttab/textbit', '@ttab/textbit-plugins'],
            icons: ['lucide-react'],
            dateFns: ['date-fns', 'date-fns-tz', '@date-fns/utc'],
            misc: ['sonner', 'zod']
          },
          plugins: [
            visualizer({
              open: false,
              filename: './bundle-analysis.html',
              gzipSize: true
            })
          ]
        }
      }
    }
  }
})

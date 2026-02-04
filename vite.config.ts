/// <reference types="vitest" />
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'


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
        BASE_URL: BASE_URL
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
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'slate-vendor': ['slate', 'slate-react', 'slate-history', 'slate-hyperscript', '@slate-yjs/react'],
            'yjs-vendor': ['yjs', 'y-indexeddb', '@slate-yjs/core'],
            'ui-vendor': ['@ttab/elephant-ui', 'lucide-react', '@tanstack/react-table'],
            'utils-vendor': ['date-fns', 'date-fns-tz']
          }
        }
      }
    }
  }
})

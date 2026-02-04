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
          manualChunks(id) {
            // Vendor chunks
            if (id.includes('node_modules/react/')) return 'react-vendor'
            if (id.includes('node_modules/react-dom/')) return 'react-vendor'
            if (id.includes('node_modules/slate')
              || id.includes('node_modules/slate-hyperscript')) return 'slate-vendor'
            if (id.includes('node_modules/yjs')
              || id.includes('node_modules/y-indexeddb')
              || id.includes('node_modules/@slate-yjs')) return 'yjs-vendor'
            if (id.includes('node_modules/@ttab/elephant-ui')
              || id.includes('node_modules/lucide-react')
              || id.includes('node_modules/@tanstack/react-table')) return 'ui-vendor'
            if (id.includes('node_modules/date-fns')) return 'utils-vendor'

            // Keep View components together with other shared components to avoid circular deps
            if (id.includes('/src/components/View/')) return 'comp-shared'

            // Large component chunks split individually
            if (id.includes('/src/components/Table/')) return 'comp-table'
            if (id.includes('/src/components/Editor/')) return 'comp-editor'
            if (id.includes('/src/components/Commands/')) return 'comp-commands'
            if (id.includes('/src/components/AssignmentTime/')) return 'comp-assignment'
            if (id.includes('/src/components/Form/')) return 'comp-form'
            if (id.includes('/src/components/Filter/')) return 'comp-filter'
            if (id.includes('/src/components/DocumentStatus/')) return 'comp-doc-status'
            if (id.includes('/src/components/DataItem/')) return 'comp-data-item'
            if (id.includes('/src/components/Version/')) return 'comp-version'
            if (id.includes('/src/components/ui/')) return 'comp-ui'
            if (id.includes('/src/components/Init/')) return 'comp-init'
            if (id.includes('/src/components/App/')) return 'comp-app'

            // Group smaller components together
            if (id.includes('/src/components/')) return 'comp-shared'

            // App code chunks
            if (id.includes('/src/views/')) return 'views'
            if (id.includes('/src/modules/')) return 'modules'
            if (id.includes('/src/lib/') || id.includes('/src/hooks/')) return 'lib-core'
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

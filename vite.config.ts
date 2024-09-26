// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(() => {
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
        '@/shared': path.resolve(__dirname, './shared')
      }
    },
    define: {
      'process.env': process.env
    },
    server: {
      hmr: {
        port: 5183
      },
      watch: {
        awaitWriteFinish: true
      }
    },
    test: {
      include: ['__tests__/**/*.test.ts(x)?'],
      globals: true,
      setupFiles: ['./setupTests.ts'],
      environment: 'jsdom',
      server: {
        deps: {
          inline: ['@ttab/elephant-ui']
        }
      }
    }
  }
})

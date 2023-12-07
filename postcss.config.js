import path from 'path'
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export default {
  plugins: {
    'postcss-import': {},
    'postcss-url': [
      {
        filter: t => {
          console.log(t, /([a-zA-Z0-9\s_\\.\-\(\):])+(.woff|.woff2)$/i.test(t.url))
          return /([a-zA-Z0-9\s_\\.\-\(\):])+(.woff|.woff2)$/i.test(t.url)
        },
        url: 'copy',
        assetsPath:
          process.env.NODE_ENV === 'production'
            ? './'
            : path.resolve(__dirname, '.vite_temp/fonts'),
        useHash: process.env.NODE_ENV !== 'production',
        hashOptions: { append: true }
      }
    ],
    tailwindcss: {},
    autoprefixer: {}
  }
}

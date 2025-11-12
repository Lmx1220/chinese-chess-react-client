import { fileURLToPath, URL } from 'node:url'

// import postcssPresetEnv from 'postcss-preset-env'
// import postcsspxtoviewport from 'postcss-px-to-viewport'
import { defineConfig } from 'vite'
import createVitePlugins from './vite/plugins.js'
// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  // const env = loadEnv(mode, process.cwd())
  return {
    plugins: createVitePlugins(mode, command === 'build'),
    // plugins: [react()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/chinese-chess': {
          // target: 'http://127.0.0.1:9099',
          target: 'https://chess.kpui.top',
          ws: true,
          changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/share/': {
          target: 'http://127.0.0.1:7005',
          ws: true,
          changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
        },
      },
    },
    define: {
      global: 'window',
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      // 分包策略
      rollupOptions: {
        output: {
          manualChunks: {},
        },
      },
      chunkSizeWarningLimit: 2000,
      // minify: 'terser',
      // outDir: 'dist',
      sourcemap: false,
      cssCodeSplit: true,
      // terserOptions: {
      //   compress: {
      //     drop_debugger: true,
      //     drop_console: true,
      //   },
      // },
    },
  }
})

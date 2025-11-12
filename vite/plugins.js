import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'
import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import Archiver from 'vite-plugin-archiver'
import { compression } from 'vite-plugin-compression2'

export default function createVitePlugins(mode, _isBuild = false) {
  const viteEnv = loadEnv(mode, process.cwd())
  const vitePlugins = [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    // https://github.com/nonzzz/vite-plugin-compression
    viteEnv.VITE_BUILD_COMPRESS && compression({
      threshold: 10240,
      exclude: [/\.(br)$/, /\.(gz)$/],
      algorithms: viteEnv.VITE_BUILD_COMPRESS.split(',').map(item => ({
        gzip: 'gzip',
        brotli: 'brotliCompress',
      }[item])),
    }),

    viteEnv.VITE_BUILD_ARCHIVE && Archiver({
      archiveType: viteEnv.VITE_BUILD_ARCHIVE,
    }),
    createAppLoadingPlugin(),
    {
      name: 'vite-plugin-debug-plugin',
      enforce: 'pre',
      transform: (code, id) => {
        if (/src\/main.ts$/.test(id)) {
          if (viteEnv.VITE_APP_DEBUG_TOOL === 'eruda') {
            code = code.concat(`
              import eruda from 'eruda'
              eruda.init()
            `)
          }
          else if (viteEnv.VITE_APP_DEBUG_TOOL === 'vconsole') {
            code = code.concat(`
              import VConsole from 'vconsole'
              new VConsole()
            `)
          }
          return {
            code,
            map: null,
          }
        }
      },
    },

  ]
  return vitePlugins
}

function getAppLoadingHtml(filePath = 'loading.html') {
  let appLoadingHtmlPath = path.join(process.cwd(), filePath)
  if (!fs.existsSync(appLoadingHtmlPath)) {
    appLoadingHtmlPath = url.fileURLToPath(new URL('../loading.html', import.meta.url))
  }
  return fs.readFileSync(appLoadingHtmlPath, 'utf8')
}

export function createAppLoadingPlugin(appLoadingHtmlPath) {
  const virtualModuleId = 'virtual:app-loading'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`
  return {
    name: 'vite-plugin-app-loading',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return {
          code: `
            export function loadingFadeOut() {
              const loadingEl = document.querySelector('[data-app-loading]')
              if (loadingEl) {
                loadingEl.style['pointer-events'] = 'none'
                loadingEl.style.visibility = 'hidden'
                loadingEl.style.opacity = 0
                loadingEl.style.transition = 'all 0.5s ease-out'
                loadingEl.addEventListener('transitionend', () => loadingEl.remove(), { once: true })
              }
            }
          `,
          map: null,
        }
      }
    },
    enforce: 'pre',
    transformIndexHtml: {
      handler: async html => html.replace(/<\/body>/, `${
        `<div data-app-loading style="position: fixed; top: 0; left: 0; z-index: 10000; width: 100vw; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; user-select: none;">${getAppLoadingHtml(appLoadingHtmlPath)}</div>`
      }</body>`),
      order: 'pre',
    },
  }
}

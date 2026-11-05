import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Injecte la feuille de style directement dans index.html.
 *
 * Le CSS global ne pèse que ~11 Ko gzip : l'inliner supprime une requête
 * bloquante (≈150 ms sur mobile) et accélère le premier rendu.
 */
function inlineCssPlugin(): Plugin {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html

        for (const [fileName, asset] of Object.entries(ctx.bundle)) {
          if (asset.type !== 'asset' || !fileName.endsWith('.css')) continue

          const css = typeof asset.source === 'string'
            ? asset.source
            : Buffer.from(asset.source).toString('utf8')
          const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const linkTag = new RegExp(`<link[^>]+href="[^"]*${escaped}"[^>]*>`)

          if (linkTag.test(html)) {
            html = html.replace(linkTag, `<style>${css}</style>`)
            delete ctx.bundle[fileName]
          }
        }

        return html
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), inlineCssPlugin()],
  base: '/',
  // Les chunks Firebase embarquent de gros commentaires de licence : inutiles
  // pour le navigateur et signalés comme « JavaScript non minifié ».
  esbuild: {
    legalComments: 'none',
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@firebase/firestore') || id.includes('firebase/firestore')) {
              return 'vendor-firestore';
            }
            if (id.includes('@firebase/auth') || id.includes('firebase/auth')) {
              return 'vendor-auth';
            }
            if (id.includes('@firebase/storage') || id.includes('firebase/storage')) {
              return 'vendor-storage';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase-core';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('browser-image-compression')) {
              return 'vendor-compression';
            }
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              id.includes('react-helmet-async')
            ) {
              return 'vendor-react';
            }
          }
        }
      }
    }
  }
})

import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

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

/**
 * Injecte dans index.html les variantes du hero (src/lib/heroManifest.json,
 * produit par scripts/images/build-hero.mjs) : le script de préchargement du
 * <head> et le composant Home lisent ainsi la même liste de fichiers.
 */
function heroManifestPlugin(): Plugin {
  return {
    name: 'hero-manifest',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const manifest = JSON.parse(readFileSync('src/lib/heroManifest.json', 'utf8')) as {
          avif: { url: string; width: number }[]
          webp: { url: string; width: number }[]
        }
        const slim = (list: { url: string; width: number }[]) =>
          list.map(({ url, width }) => ({ url, width }))
        return html.replace(
          '__HERO_MANIFEST__',
          JSON.stringify({ avif: slim(manifest.avif), webp: slim(manifest.webp) }),
        )
      },
    },
  }
}

/**
 * Échoue tôt si la clé Firebase n'est pas fournie par `.env` (voir `.env.example`).
 * Elle est injectée dans `index.html` et utilisée par Firestore REST : sans elle,
 * le préchargement et les pages publiques seraient cassés silencieusement.
 */
function firebaseApiKeyPlugin(): Plugin {
  return {
    name: 'require-firebase-api-key',
    configResolved(config) {
      if (!config.env.VITE_FIREBASE_API_KEY) {
        throw new Error(
          'VITE_FIREBASE_API_KEY manquant : copiez .env.example vers .env et renseignez la clé Firebase.',
        )
      }
    },
  }
}

/**
 * Précharge le chunk JavaScript de la route demandée dès la lecture du HTML.
 *
 * Sans cela, le chunk n'est découvert qu'après l'exécution de React : sur
 * mobile, ce détour coûte un aller-retour réseau complet avant d'afficher
 * /Acheter, /Vendre ou /EliseBUIL. Le HTML est commun à toutes les routes : on
 * injecte donc une petite table de correspondance, et seules les pages
 * réellement visitées téléchargent leur chunk (aucun octet gaspillé).
 */
function routeChunkPreloadPlugin(): Plugin {
  const componentByRoute: Record<string, string> = {
    '/': 'home',
    '/acheter': 'HouseExplorer',
    '/vendre': 'Selling_form',
    '/elisebuil': 'RealWhoamI',
    '/estimation': 'EstimationForm',
    '/gestion': 'adminPanel',
  };
  const houseRoute = 'HouseDetails';

  return {
    name: 'route-chunk-preload',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;

        const chunkByComponent: Record<string, string> = {};
        const dependenciesByFile: Record<string, string[]> = {};

        for (const [fileName, output] of Object.entries(ctx.bundle)) {
          if (output.type !== 'chunk') continue;
          dependenciesByFile[fileName] = output.imports.map((dependency) => `/${dependency}`);
          if (!output.facadeModuleId) continue;
          const component = output.facadeModuleId.split('/').pop()?.replace(/\.tsx?$/, '');
          if (component) chunkByComponent[component] = fileName;
        }

        const preloadFor = (component: string): string[] | undefined => {
          const fileName = chunkByComponent[component];
          if (!fileName) return undefined;
          return [`/${fileName}`, ...(dependenciesByFile[fileName] ?? [])];
        };

        const routes: Record<string, string[]> = {};
        for (const [route, component] of Object.entries(componentByRoute)) {
          const files = preloadFor(component);
          if (files) routes[route] = files;
        }
        const houseFiles = preloadFor(houseRoute);
        if (houseFiles) routes['/house/'] = houseFiles;
        if (Object.keys(routes).length === 0) return html;

        const script = `<script>(function(){var r=${JSON.stringify(routes)};var p=(location.pathname||'/').replace(/\\/+$/,'').toLowerCase()||'/';var u=r[p]||(p.indexOf('/house/')===0?r['/house/']:null);if(!u)return;for(var i=0;i<u.length;i++){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=u[i];document.head.appendChild(l);}})();</script>`;

        return html.replace('</head>', `  ${script}\n  </head>`);
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), heroManifestPlugin(), inlineCssPlugin(), routeChunkPreloadPlugin(), firebaseApiKeyPlugin()],
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

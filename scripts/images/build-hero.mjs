#!/usr/bin/env node
/**
 * Génère les variantes du hero (AVIF + WebP, plusieurs largeurs) et son
 * placeholder flou à partir de l'image source.
 *
 *   node scripts/images/build-hero.mjs <source> [--out public/hero] [--version 2]
 *
 * - Les variantes sont encodées depuis la source, jamais depuis une variante
 *   déjà recompressée (pas de perte cumulée).
 * - Aucune variante n'est agrandie au-delà de la largeur de la source.
 * - Réglages mesurés (PSNR vs source, largeur 1280) : AVIF q55 ≈ 38,5 dB pour
 *   ~92 Ko, contre 34,4 dB pour l'ancien WebP de 105 Ko (artefacts visibles). Au-delà de ~72 Ko à 960 px, le LCP mobile se dégrade (Lighthouse, 4G simulée).
 * - Les noms contiennent le hash de leur contenu : `firebase.json` les sert en
 *   cache immuable d'un an, et une nouvelle image obtient de nouvelles URL.
 * - Écrit `src/lib/heroManifest.json`, lu par l'application ET injecté dans
 *   index.html au build (voir vite.config.ts) : une seule source de vérité.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)
const source = args.find((a) => !a.startsWith('--'))
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}
if (!source) {
  console.error('Usage : node scripts/images/build-hero.mjs <source> [--out public/hero]')
  process.exit(1)
}

const outDir = opt('out', 'public/hero')
const manifestPath = opt('manifest', 'src/lib/heroManifest.json')
const WIDTHS = [640, 960, 1280, 1600, 1920, 2400]
const QUALITY = { avif: Number(opt('avif-quality', 55)), webp: Number(opt('webp-quality', 80)) }

const input = await readFile(source)
const meta = await sharp(input).metadata()
const hash = createHash('sha1').update(input).digest('hex').slice(0, 8) // identifie la source

// Largeurs inférieures à la source + la largeur native (jamais d'agrandissement).
const widths = [...new Set([...WIDTHS.filter((w) => w < meta.width), meta.width])]

await mkdir(outDir, { recursive: true })
for (const file of await readdir(outDir)) {
  if (/^hero-.*\.(avif|webp)$/.test(file)) await rm(path.join(outDir, file))
}

const variants = { avif: [], webp: [] }
for (const width of widths) {
  const base = sharp(input).rotate().resize({ width, withoutEnlargement: true })
  for (const format of ['avif', 'webp']) {
    const pipeline =
      format === 'avif'
        ? base.clone().avif({ quality: QUALITY.avif, effort: 7 })
        : base.clone().webp({ quality: QUALITY.webp, effort: 6, smartSubsample: true })
    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
    const fileHash = createHash('sha1').update(data).digest('hex').slice(0, 8)
    const name = `hero-${width}.${fileHash}.${format}`
    await writeFile(path.join(outDir, name), data)
    variants[format].push({ width, height: info.height, bytes: data.length, url: `/hero/${name}` })
  }
}

// Placeholder : miniature 32 px floue, intégrée en base64 (≈ 300 octets) + couleur moyenne.
const lqip = await sharp(input).resize({ width: 32 }).blur(1).webp({ quality: 40 }).toBuffer()
const { dominant } = await sharp(input).stats()
const color = `#${[dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`

const manifest = {
  hash,
  width: meta.width,
  height: meta.height,
  color,
  lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
  avif: variants.avif,
  webp: variants.webp,
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

for (const format of ['avif', 'webp']) {
  console.log(format.toUpperCase(), variants[format].map((v) => `${v.width}w=${(v.bytes / 1024).toFixed(0)}Ko`).join('  '))
}
console.log(`Manifeste : ${manifestPath}  (couleur ${color}, LQIP ${lqip.length} octets)`)

#!/usr/bin/env node
/**
 * Préchauffe le cache de /api/img pour toutes les photos des annonces.
 *
 *   node scripts/images/warm-cache.mjs [https://elisebuilimmobilierguadeloupe.com]
 *
 * À lancer UNE fois après le déploiement de la fonction `img` : le CDN garde ensuite
 * chaque variante un an, donc aucun visiteur n'attend la conversion. Les nouvelles
 * photos sont préchauffées automatiquement par l'administration (warmImage).
 * Lit VITE_FIREBASE_API_KEY dans .env (jamais affichée).
 */
import { readFile } from 'node:fs/promises'

const origin = (process.argv[2] ?? 'https://elisebuilimmobilierguadeloupe.com').replace(/\/$/, '')
const env = await readFile('.env', 'utf8').catch(() => '')
const key = process.env.VITE_FIREBASE_API_KEY ?? /^VITE_FIREBASE_API_KEY=(.+)$/m.exec(env)?.[1]?.trim()
if (!key) throw new Error('VITE_FIREBASE_API_KEY introuvable (.env)')

const WIDTHS = [480, 640, 800, 960, 1280]
const STORAGE = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?#]+)/

const api = 'https://firestore.googleapis.com/v1/projects/webimmo-6189a/databases/(default)/documents'
const { documents = [] } = await (await fetch(`${api}/houses?pageSize=300&key=${key}`)).json()
const strings = (field) => field?.arrayValue?.values?.map((v) => v.stringValue) ?? (field?.stringValue ? [field.stringValue] : [])

const paths = new Set()
for (const doc of documents) {
  const f = doc.fields ?? {}
  // Cartes : miniature + photo principale ; fiche : toute la galerie.
  for (const url of [...strings(f.thumbnailImage), ...strings(f.principalImage), ...strings(f.images)]) {
    const m = STORAGE.exec(url ?? '')
    if (m) paths.add(decodeURIComponent(m[1]))
  }
}

const jobs = [...paths].flatMap((p) => WIDTHS.map((w) => `${origin}/api/img?p=${encodeURIComponent(p)}&w=${w}&fm=avif`))
console.log(`${paths.size} photos × ${WIDTHS.length} largeurs = ${jobs.length} variantes`)

let done = 0, failed = 0
const worker = async () => {
  while (jobs.length) {
    const url = jobs.shift()
    try { const r = await fetch(url); await r.arrayBuffer(); if (!r.ok) failed++ } catch { failed++ }
    if (++done % 25 === 0) console.log(`  ${done}…`)
  }
}
await Promise.all(Array.from({ length: 6 }, worker))
console.log(`Terminé : ${done - failed} OK, ${failed} en échec`)

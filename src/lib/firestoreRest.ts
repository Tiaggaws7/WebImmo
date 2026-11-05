import type { House } from '../types';

/**
 * Accès en lecture à Firestore via l'API REST publique.
 *
 * Le SDK Firebase (firestore + auth + storage + core) pèse ~90 Ko gzip et
 * s'exécute sur le thread principal. Les pages publiques n'ont besoin que de
 * lire des documents : l'API REST renvoie le même contenu, est mise en cache
 * par le navigateur/CDN et évite de charger tout le SDK.
 *
 * Le panneau d'administration (/Gestion) continue d'utiliser le SDK pour les
 * écritures et l'authentification.
 */

const PROJECT_ID = 'webimmo-6189a';
const API_KEY = 'AIzaSyC69Z9yIw8aGdRt9k4CQp8SuRpH6oJGSGI';
const DOCUMENTS_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** Valeur Firestore au format REST. */
type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  referenceValue?: string;
  geoPointValue?: { latitude: number; longitude: number };
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreListResponse = {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
};

/** Page initiale éventuellement préchargée depuis index.html. */
type PrefetchedData = {
  settings?: Promise<FirestoreDocument | null>;
  houses?: Promise<FirestoreListResponse | null>;
};

declare global {
  interface Window {
    __WEB_IMMO_FS__?: PrefetchedData;
    __WEB_IMMO_HERO__?: string;
  }
}

function decodeValue(value: FirestoreValue): unknown {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.referenceValue !== undefined) return value.referenceValue;
  if (value.geoPointValue !== undefined) return value.geoPointValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values ?? []).map(decodeValue);
  }
  if (value.mapValue !== undefined) {
    return decodeFields(value.mapValue.fields ?? {});
  }
  return undefined;
}

function decodeFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = decodeValue(value);
  }
  return result;
}

function decodeDocument(document: FirestoreDocument): Record<string, unknown> {
  return {
    ...decodeFields(document.fields ?? {}),
    id: document.name.slice(document.name.lastIndexOf('/') + 1),
  };
}

async function getJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Firestore REST ${response.status} pour ${url}`);
  }
  return (await response.json()) as T;
}

/** Récupère toutes les pages d'une collection (300 documents par page). */
async function listCollection(name: string, firstPage?: Promise<FirestoreListResponse | null>) {
  const documents: FirestoreDocument[] = [];
  let page = firstPage ? await firstPage : null;

  if (!page) {
    const url = new URL(`${DOCUMENTS_URL}/${name}`);
    url.searchParams.set('key', API_KEY);
    url.searchParams.set('pageSize', '300');
    page = await getJson<FirestoreListResponse>(url.toString());
  }

  while (page) {
    documents.push(...(page.documents ?? []));

    if (!page.nextPageToken) break;
    const url = new URL(`${DOCUMENTS_URL}/${name}`);
    url.searchParams.set('key', API_KEY);
    url.searchParams.set('pageSize', '300');
    url.searchParams.set('pageToken', page.nextPageToken);
    page = await getJson<FirestoreListResponse>(url.toString());
  }

  return documents;
}

let housesPromise: Promise<House[]> | null = null;
let settingsPromise: Promise<{ heroImage?: string }> | null = null;

/**
 * Toutes les annonces, décodées. La promesse est partagée pour éviter de
 * recharger la collection à chaque navigation côté client.
 */
export function fetchHouses(): Promise<House[]> {
  if (!housesPromise) {
    housesPromise = listCollection('houses', window.__WEB_IMMO_FS__?.houses)
      .then((documents) => documents.map((document) => decodeDocument(document) as unknown as House))
      .catch((error) => {
        housesPromise = null;
        throw error;
      });
  }
  return housesPromise;
}

/** Réglages de la page d'accueil (image hero). */
export function fetchHomepageSettings(): Promise<{ heroImage?: string }> {
  if (!settingsPromise) {
    settingsPromise = (async () => {
      const prefetched = window.__WEB_IMMO_FS__?.settings;
      const document = prefetched
        ? await prefetched
        : await getJson<FirestoreDocument>(
            `${DOCUMENTS_URL}/settings/homepage?key=${encodeURIComponent(API_KEY)}`,
          );

      if (!document) return {};
      const fields = decodeFields(document.fields ?? {});
      return { heroImage: typeof fields.heroImage === 'string' ? fields.heroImage : undefined };
    })().catch((error) => {
      settingsPromise = null;
      throw error;
    });
  }
  return settingsPromise;
}

/** Une annonce précise ; renvoie `null` si elle n'existe pas. */
export async function fetchHouse(id: string): Promise<House | null> {
  const document = await getJson<FirestoreDocument>(
    `${DOCUMENTS_URL}/houses/${encodeURIComponent(id)}?key=${encodeURIComponent(API_KEY)}`,
  );
  return document ? (decodeDocument(document) as unknown as House) : null;
}

/** Démarre les requêtes au plus tôt, sans bloquer le rendu. */
export function prefetchPublicData(): void {
  void fetchHouses().catch(() => {});
  void fetchHomepageSettings().catch(() => {});
}

/** À appeler après une écriture depuis le panneau d'administration. */
export function invalidateHousesCache(): void {
  housesPromise = null;
}

export function invalidateSettingsCache(): void {
  settingsPromise = null;
}

/** Image hero connue avant le rendu React (préchargée par index.html). */
export function getEarlyHeroImage(): string | undefined {
  return window.__WEB_IMMO_HERO__;
}

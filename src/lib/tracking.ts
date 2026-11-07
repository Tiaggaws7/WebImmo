/**
 * Mesure d'audience first-party, anonyme et sans cookie tiers.
 *
 * Chaque événement est envoyé à `/api/track` (Cloud Function) avec un
 * identifiant visiteur/session aléatoires. Aucune IP, aucun nom, aucun email
 * ni téléphone n'est transmis : les formulaires ne remontent que leur type et
 * leur statut. L'utilisateur peut refuser la mesure via le pied de page.
 */

import { isAnalyticsOptedOut } from './analytics';

const TRACK_URL = (import.meta.env.VITE_ANALYTICS_URL as string | undefined)?.trim() || '/api/track';
const ENABLED = Boolean(import.meta.env.VITE_ANALYTICS_URL) || Boolean(import.meta.env.PROD);
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const VISITOR_LIFETIME_MS = 13 * 30 * 24 * 60 * 60 * 1000;
const MAX_META_STRING = 120;

const STORAGE = {
  visitor: 'wi_vid',
  visitorExp: 'wi_vid_exp',
  session: 'wi_sid',
  sessionTs: 'wi_sid_ts',
  lastVisit: 'wi_last_visit',
} as const;

/** Métadonnées autorisées : jamais de donnée personnelle. */
const META_KEYS = new Set([
  'form',
  'step',
  'status',
  'houseId',
  'houseTitle',
  'price',
  'location',
  'resultCount',
  'filters',
  'method',
  'target',
  'depth',
  'maxScroll',
  'dwellMs',
  'imageIndex',
  'platform',
  'source',
]);

type TrackMeta = Record<string, string | number | boolean | undefined>;

type TrackPayload = {
  type: 'pageview' | 'event';
  name?: string;
  path: string;
  title?: string;
  referrer?: string;
  utm?: Record<string, string>;
  visitorId: string;
  sessionId: string;
  firstVisitToday: boolean;
  newSession: boolean;
  screen?: string;
  viewport?: string;
  language?: string;
  timezone?: string;
  connection?: string;
  meta?: Record<string, string | number | boolean>;
};

type PageContext = {
  path: string;
  title: string;
  startedAt: number;
  maxScroll: number;
  depthSent: Set<number>;
};

const memory = {
  visitorId: '',
  visitorExpiresAt: 0,
  sessionId: '',
  sessionTs: 0,
  lastVisitDate: '',
};

const startedForms = new Set<string>();
let autoTrackingStarted = false;
let lastPageviewKey = '';
let lastPageviewAt = 0;
let pageContext: PageContext | null = null;
let scrollScheduled = false;

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function readStorage(kind: 'local' | 'session', key: string): string {
  try {
    const storage = kind === 'local' ? window.localStorage : window.sessionStorage;
    return storage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeStorage(kind: 'local' | 'session', key: string, value: string): void {
  try {
    const storage = kind === 'local' ? window.localStorage : window.sessionStorage;
    storage.setItem(key, value);
  } catch {
    /* stockage indisponible : la valeur reste en mémoire */
  }
}

function removeStorage(kind: 'local' | 'session', key: string): void {
  try {
    const storage = kind === 'local' ? window.localStorage : window.sessionStorage;
    storage.removeItem(key);
  } catch {
    /* rien à faire */
  }
}

function getVisitorId(): string {
  const storedId = readStorage('local', STORAGE.visitor);
  const storedExpiresAt = Number(readStorage('local', STORAGE.visitorExp) || 0);
  const id = storedId || memory.visitorId;
  const expiresAt = storedExpiresAt || memory.visitorExpiresAt;
  if (id && expiresAt > Date.now()) return id;

  const newId = randomId();
  const newExpiresAt = Date.now() + VISITOR_LIFETIME_MS;
  memory.visitorId = newId;
  memory.visitorExpiresAt = newExpiresAt;
  writeStorage('local', STORAGE.visitor, newId);
  writeStorage('local', STORAGE.visitorExp, String(newExpiresAt));
  return newId;
}

function getSession(): { id: string; isNew: boolean } {
  const now = Date.now();
  const storedId = readStorage('session', STORAGE.session);
  const storedTs = Number(readStorage('session', STORAGE.sessionTs) || 0);
  const id = storedId || memory.sessionId;
  const ts = storedTs || memory.sessionTs;

  if (id && now - ts < SESSION_TIMEOUT_MS) {
    memory.sessionId = id;
    memory.sessionTs = now;
    writeStorage('session', STORAGE.sessionTs, String(now));
    return { id, isNew: false };
  }

  const newId = randomId();
  memory.sessionId = newId;
  memory.sessionTs = now;
  writeStorage('session', STORAGE.session, newId);
  writeStorage('session', STORAGE.sessionTs, String(now));
  return { id: newId, isNew: true };
}

function localDateKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function takeFirstVisitToday(): boolean {
  const today = localDateKey();
  const stored = readStorage('local', STORAGE.lastVisit) || memory.lastVisitDate;
  if (stored === today) return false;

  memory.lastVisitDate = today;
  writeStorage('local', STORAGE.lastVisit, today);
  return true;
}

function normalizePath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] || '/';
  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
}

function isTrackablePage(): boolean {
  return !window.location.pathname.startsWith('/Gestion');
}

function externalReferrer(): string | undefined {
  if (!document.referrer) return undefined;
  try {
    return new URL(document.referrer).hostname === window.location.hostname
      ? undefined
      : document.referrer;
  } catch {
    return undefined;
  }
}

function utmParams(): Record<string, string> | undefined {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const value = params.get(key);
    if (value) utm[key.replace('utm_', '')] = value.slice(0, 80);
  }
  return Object.keys(utm).length ? utm : undefined;
}

function sanitizeMeta(meta: TrackMeta): Record<string, string | number | boolean> {
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!META_KEYS.has(key) || value === undefined) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim().slice(0, MAX_META_STRING);
      if (trimmed) clean[key] = trimmed;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      clean[key] = value;
    } else if (typeof value === 'boolean') {
      clean[key] = value;
    }
  }
  return clean;
}

function basePayload(type: 'pageview' | 'event', name?: string, consumeIdentity = true): TrackPayload {
  const session = getSession();
  const connection = (navigator as Navigator & {
    connection?: { effectiveType?: string };
  }).connection?.effectiveType;

  return {
    type,
    name,
    path: normalizePath(window.location.pathname),
    title: document.title.slice(0, 160),
    referrer: externalReferrer(),
    utm: utmParams(),
    visitorId: getVisitorId(),
    sessionId: session.id,
    firstVisitToday: consumeIdentity ? takeFirstVisitToday() : false,
    newSession: consumeIdentity ? session.isNew : false,
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    connection,
  };
}

function send(payload: TrackPayload): void {
  if (!ENABLED || isAnalyticsOptedOut()) return;

  const body = JSON.stringify(payload);
  try {
    const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
    if (navigator.sendBeacon?.(TRACK_URL, blob)) return;
  } catch {
    /* on tente fetch ci-dessous */
  }

  void fetch(TRACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    /* la mesure d'audience ne doit jamais casser la navigation */
  });
}

function flushPageLeave(): void {
  if (!pageContext || !ENABLED || isAnalyticsOptedOut()) {
    pageContext = null;
    return;
  }

  const context = pageContext;
  pageContext = null;
  const dwellMs = Date.now() - context.startedAt;
  if (dwellMs < 1000) return;

  const payload = basePayload('event', 'page_leave', false);
  payload.path = context.path;
  payload.title = context.title;
  payload.meta = {
    dwellMs: Math.min(dwellMs, SESSION_TIMEOUT_MS),
    maxScroll: context.maxScroll,
  };
  send(payload);
}

/** Envoie un événement first-party. */
export function trackEvent(name: string, meta: TrackMeta = {}): void {
  if (!ENABLED || isAnalyticsOptedOut() || !isTrackablePage()) return;
  if (!/^[a-z][a-z0-9_]{1,40}$/.test(name)) return;

  const cleanMeta = sanitizeMeta(meta);
  const payload = basePayload('event', name);
  payload.path = normalizePath(window.location.pathname);
  payload.meta = cleanMeta;
  send(payload);
}

/** Page vue : à appeler à chaque navigation (y compris SPA). */
export function trackPageview(path: string, title?: string): void {
  if (!ENABLED || isAnalyticsOptedOut() || !isTrackablePage()) return;

  const cleanPath = normalizePath(path);
  const now = Date.now();
  const key = `${cleanPath}|${title ?? ''}`;
  if (key === lastPageviewKey && now - lastPageviewAt < 1000) return;

  flushPageLeave();
  lastPageviewKey = key;
  lastPageviewAt = now;
  pageContext = {
    path: cleanPath,
    title: (title || document.title).slice(0, 160),
    startedAt: now,
    maxScroll: 0,
    depthSent: new Set(),
  };

  const payload = basePayload('pageview');
  payload.path = cleanPath;
  payload.title = pageContext.title;
  send(payload);
}

/** Formulaire commencé (une seule fois par session). */
export function trackFormStart(form: string): void {
  if (startedForms.has(form)) return;
  startedForms.add(form);
  trackEvent('form_start', { form });
}

/** Étape d'un formulaire multi-étapes. */
export function trackFormStep(form: string, step: number): void {
  trackEvent('form_step', { form, step });
}

/** Soumission d'un formulaire (avant l'envoi de l'email). */
export function trackFormSubmit(form: string): void {
  trackEvent('form_submit', { form });
}

/** Résultat de l'envoi EmailJS (succès ou échec). */
export function trackEmailResult(form: string, success: boolean): void {
  trackEvent(success ? 'email_sent' : 'email_error', {
    form,
    status: success ? 'success' : 'error',
  });
}

function metaFromElement(element: HTMLElement): TrackMeta {
  const meta: TrackMeta = {};
  const attributes: Array<[string, string]> = [
    ['form', 'data-form'],
    ['step', 'data-step'],
    ['houseId', 'data-house-id'],
    ['houseTitle', 'data-house-title'],
    ['method', 'data-method'],
    ['target', 'data-target'],
    ['platform', 'data-platform'],
  ];
  for (const [key, attribute] of attributes) {
    const value = element.getAttribute(attribute);
    if (value) meta[key] = value;
  }
  return meta;
}

function isExternalLink(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return new URL(href).hostname !== window.location.hostname;
  } catch {
    return false;
  }
}

function handleClick(event: MouseEvent): void {
  const target = event.target instanceof Element ? event.target : null;
  const element = target?.closest<HTMLElement>('a, [data-track]');
  if (!element) return;

  const explicit = element.getAttribute('data-track');
  if (explicit) {
    trackEvent(explicit, metaFromElement(element));
    return;
  }

  const href = element.getAttribute('href') || '';
  if (href.startsWith('tel:')) {
    trackEvent('phone_click', { method: 'phone' });
    return;
  }
  if (href.startsWith('mailto:')) {
    trackEvent('email_click', { method: 'email' });
    return;
  }
  if (/facebook\.com\/sharer|twitter\.com\/intent|x\.com\/intent|linkedin\.com\/shareArticle/i.test(href)) {
    const method = /facebook/i.test(href)
      ? 'facebook'
      : /linkedin/i.test(href)
        ? 'linkedin'
        : 'x';
    trackEvent('share', { method });
    return;
  }
  if (/api\.whatsapp\.com\/send/i.test(href)) {
    trackEvent('share', { method: 'whatsapp' });
    return;
  }
  if (/wa\.me|whatsapp\.com/i.test(href)) {
    trackEvent('whatsapp_click', { method: 'whatsapp' });
    return;
  }
  if (href.startsWith('/house/')) {
    trackEvent('listing_click', { houseId: href.split('/')[2] || '' });
    return;
  }
  if (isExternalLink(href)) {
    try {
      trackEvent('outbound_click', { target: new URL(href).hostname.replace(/^www\./, '') });
    } catch {
      /* URL invalide */
    }
  }
}

function handleScroll(): void {
  if (scrollScheduled) return;
  scrollScheduled = true;

  window.requestAnimationFrame(() => {
    scrollScheduled = false;
    if (!pageContext) return;

    const documentElement = document.documentElement;
    const maxScroll = Math.max(1, documentElement.scrollHeight - window.innerHeight);
    const percent = Math.min(100, Math.round((window.scrollY / maxScroll) * 100));
    pageContext.maxScroll = Math.max(pageContext.maxScroll, percent);

    for (const threshold of [25, 50, 75, 100]) {
      if (percent >= threshold && !pageContext.depthSent.has(threshold)) {
        pageContext.depthSent.add(threshold);
        trackEvent('scroll_depth', { depth: threshold });
      }
    }
  });
}

/** Active le suivi automatique des clics, du scroll et des fins de page. */
export function setupAutoTracking(): void {
  if (autoTrackingStarted || typeof window === 'undefined') return;
  autoTrackingStarted = true;

  document.addEventListener('click', handleClick, true);
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPageLeave();
  });
  window.addEventListener('pagehide', flushPageLeave);
}

/** Réinitialise le contexte de page (utile pour les tests). */
export function resetTrackingContext(): void {
  pageContext = null;
  lastPageviewKey = '';
  lastPageviewAt = 0;
  startedForms.clear();
  removeStorage('session', STORAGE.session);
  removeStorage('session', STORAGE.sessionTs);
}

/** Supprime les identifiants anonymes (appelé lors d'un refus de mesure). */
export function clearTrackingIdentity(): void {
  removeStorage('local', STORAGE.visitor);
  removeStorage('local', STORAGE.visitorExp);
  removeStorage('local', STORAGE.lastVisit);
  removeStorage('session', STORAGE.session);
  removeStorage('session', STORAGE.sessionTs);
  memory.visitorId = '';
  memory.visitorExpiresAt = 0;
  memory.sessionId = '';
  memory.sessionTs = 0;
  memory.lastVisitDate = '';
  pageContext = null;
  lastPageviewKey = '';
  lastPageviewAt = 0;
  startedForms.clear();
}

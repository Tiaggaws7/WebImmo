/**
 * Capture des demandes (leads) côté navigateur.
 *
 * La demande est enregistrée dans Firestore avant l'envoi EmailJS. Si
 * l'email échoue ou si le visiteur ferme la page, la demande reste visible
 * dans /Gestion → Demandes.
 */

const LEADS_URL = (
  (import.meta.env.VITE_LEADS_URL as string | undefined)?.trim() || '/api/leads'
).replace(/\/+$/, '');
const ENABLED = Boolean(import.meta.env.VITE_LEADS_URL) || Boolean(import.meta.env.PROD);
const REQUEST_TIMEOUT_MS = 6000;

export type LeadType = 'estimation' | 'vendre' | 'contact';
export type LeadStatus = 'email_sent' | 'email_error';

export type LeadContact = {
  name?: string;
  email?: string;
  phone?: string;
};

export type LeadReceipt = {
  id: string;
  token: string;
};

function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function sourceFromLocation(): string {
  if (typeof window === 'undefined') return '';
  const utmSource = new URLSearchParams(window.location.search).get('utm_source');
  if (utmSource) return utmSource.slice(0, 100);
  if (!document.referrer) return '';
  try {
    return new URL(document.referrer).hostname.replace(/^www\./, '').slice(0, 100);
  } catch {
    return '';
  }
}

/** Enregistre la demande avant EmailJS. Renvoie null si la capture échoue. */
export async function submitLead(input: {
  type: LeadType;
  contact: LeadContact;
  data: Record<string, unknown>;
}): Promise<LeadReceipt | null> {
  if (!ENABLED || typeof window === 'undefined') return null;

  const payload = {
    submissionId: newSubmissionId(),
    type: input.type,
    contact: input.contact,
    data: input.data,
    pagePath: window.location.pathname,
    source: sourceFromLocation(),
    website: '',
  };

  const firstAttempt = await postLead(payload);
  if (firstAttempt) return firstAttempt;

  // Une seule nouvelle tentative, avec le même identifiant pour éviter un doublon.
  await new Promise((resolve) => window.setTimeout(resolve, 600));
  return postLead(payload);
}

async function postLead(payload: Record<string, unknown>): Promise<LeadReceipt | null> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${LEADS_URL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      keepalive: true,
    });

    if (!response.ok) return null;

    const result = (await response.json()) as {
      id?: string;
      token?: string;
      skipped?: boolean;
    };

    if (result.skipped || !result.id || !result.token) return null;
    return { id: result.id, token: result.token };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

/** Met à jour le statut EmailJS ; toujours en arrière-plan, sans bloquer. */
export function updateLeadStatus(
  receipt: LeadReceipt | null,
  status: LeadStatus,
  error?: string,
): void {
  if (!ENABLED || !receipt) return;

  try {
    void fetch(`${LEADS_URL}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: receipt.id,
        token: receipt.token,
        status,
        error: error?.slice(0, 500) || '',
      }),
      keepalive: true,
    }).catch(() => {
      /* le statut sera simplement laissé à « nouvelle » */
    });
  } catch {
    /* rien à faire : la demande est déjà enregistrée */
  }
}

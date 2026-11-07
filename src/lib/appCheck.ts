import { getToken, initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import type { AppCheck } from 'firebase/app-check';
import { app } from './firebaseApp';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

let instance: AppCheck | null = null;

/**
 * Initialise App Check (reCAPTCHA v3) si une clé de site est configurée.
 * Sans clé, l'application continue de fonctionner : pratique en local.
 */
export function initAppCheck(): AppCheck | null {
  if (!SITE_KEY) return null;
  if (!instance) {
    instance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }
  return instance;
}

/**
 * Jeton à joindre aux appels REST Firestore manuels.
 * `undefined` si App Check n'est pas configuré ou si reCAPTCHA échoue.
 */
export async function getAppCheckToken(): Promise<string | undefined> {
  const appCheck = initAppCheck();
  if (!appCheck) return undefined;

  try {
    const result = await getToken(appCheck);
    return result.token;
  } catch (error) {
    console.warn('App Check indisponible :', error);
    return undefined;
  }
}

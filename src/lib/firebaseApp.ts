import { getApps, initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';

/**
 * Configuration Firebase publique : ces valeurs sont de toute façon visibles
 * dans le bundle. Seule la clé API vient de `.env` (voir `SECURITY.md`).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: 'webimmo-6189a.firebaseapp.com',
  projectId: 'webimmo-6189a',
  storageBucket: 'webimmo-6189a.firebasestorage.app',
  messagingSenderId: '487406344453',
  appId: '1:487406344453:web:38762583c738366c2bbf6c',
};

/** Instance Firebase unique, partagée par l'admin et App Check. */
export const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

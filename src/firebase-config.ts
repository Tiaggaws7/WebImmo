import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initAppCheck } from './lib/appCheck';
import { app } from './lib/firebaseApp';

// App Check doit être initialisé avant les services Firebase pour que le SDK
// joigne automatiquement le jeton aux requêtes Firestore/Auth/Storage.
initAppCheck();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export { app };

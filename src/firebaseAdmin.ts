// src/firebaseAdmin.ts
import admin from 'firebase-admin';

// IMPORTANT : Téléchargez votre clé de service depuis Firebase Console et placez-la dans le fichier serviceAccountKey.json
import serviceAccount from './serviceAccountKey.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: 'webimmo-6189a.firebasestorage.app',  // Remplacez par le nom de votre bucket Firebase Storage
    databaseURL: 'https://houses.firebaseio.com'  // Remplacez par l'URL de votre base Firebase
  });
}

export default admin;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { prefetchPublicData } from './lib/firestoreRest'

// Démarre les lectures Firestore (REST) avant même le rendu React : l'URL du
// hero et les annonces sont ainsi disponibles au premier rendu.
prefetchPublicData()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

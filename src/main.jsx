import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { frFR } from "@clerk/localizations";
import { BrowserRouter } from 'react-router-dom';

// La clé publique de votre application Clerk
// Pour la production, il est recommandé de la stocker dans des variables d'environnement
const PUBLISHABLE_KEY = "pk_test_Z29sZGVuLW95c3Rlci00My5jbGVyay5hY2NvdW50cy5kZXYk"

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        localization={frFR}
        appearance={{
          variables: {
            colorPrimary: '#D69E2E' // Votre couleur de marque par défaut
          }
        }}
      >
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

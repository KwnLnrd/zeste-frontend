import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';
import { frFR } from "@clerk/localizations";
import { BrowserRouter } from 'react-router-dom';

// Correction: Charger la clé depuis les variables d'environnement Vite
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("La clé publiable (VITE_CLERK_PUBLISHABLE_KEY) est manquante dans votre fichier .env.local");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        localization={frFR}
        appearance={{
          variables: {
            colorPrimary: '#D69E2E'
          }
        }}
      >
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

// ========================================================================

// Fichier: src/layouts/DashboardLayout.jsx

import { useUser, UserButton, useAuth } from '@clerk/clerk-react';
import { BarChart, Users, Settings, Utensils, QrCode, ExternalLink, Copy } from 'lucide-react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';

// --- Composant de la Page Personnalisation (avec gestion d'erreur améliorée) ---
const PageSettings = () => {
    const { getToken } = useAuth();
    const [settings, setSettings] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const qrCodeRef = useRef(null);

    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const reviewPageUrl = settings?.slug ? `https://getzeste.fr/avis/${settings.slug}` : '';

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            setError(null);

            if (!apiUrl) {
                setError("L'URL de l'API n'est pas configurée. Vérifiez votre fichier .env.local");
                setIsLoading(false);
                return;
            }

            try {
                const token = await getToken();
                const response = await fetch(`${apiUrl}/api/v1/restaurant/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Impossible de charger les paramètres.');
                }
                const data = await response.json();
                setSettings(data);
                // Construit l'URL complète pour l'aperçu du logo
                if (data.logoUrl) {
                    setLogoPreview(`${apiUrl}${data.logoUrl}`);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [getToken, apiUrl]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append('name', settings.name);
            formData.append('primaryColor', settings.primaryColor);
            formData.append('googleLink', settings.googleLink);
            formData.append('tripadvisorLink', settings.tripadvisorLink);
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const response = await fetch(`${apiUrl}/api/v1/restaurant/settings`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'La sauvegarde a échoué.');
            }
            
            const result = await response.json();
            // Met à jour l'aperçu avec la nouvelle URL du logo si elle existe
            if (result.logoUrl) {
                 setLogoPreview(`${apiUrl}${result.logoUrl}`);
            }
            // Remplacez alert par un système de notification plus élégant à l'avenir
            alert('Paramètres enregistrés avec succès !');

        } catch (err) {
            setError(err.message);
            alert(`Erreur: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Les autres fonctions (handleDownloadQRCode, copyToClipboard) restent identiques...

    if (isLoading) return <div className="p-8">Chargement des paramètres...</div>;
    if (error) return <div className="p-8 text-red-500 font-bold">Erreur: {error}</div>;
    if (!settings) return <div className="p-8">Aucun paramètre trouvé.</div>;


    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold font-serif mb-8">Personnalisation</h1>
            <form onSubmit={handleSubmit}>
                {/* Le reste du JSX du formulaire reste identique... */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Card: Informations Générales */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-xl font-bold font-serif mb-4">Informations Générales</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="restaurant-name" className="block text-sm font-medium text-gray-700">Nom du Restaurant</label>
                                    <input type="text" id="restaurant-name" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <img src={logoPreview || 'https://placehold.co/100x100/f1f5f9/cbd5e1?text=Logo'} alt="Aperçu du logo" className="w-24 h-24 rounded-md object-contain bg-slate-100 p-1 border" />
                                    <div className="flex-1">
                                        <label htmlFor="logo-file" className="block text-sm font-medium text-gray-700">Changer le logo</label>
                                        <input type="file" id="logo-file" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" accept="image/png, image/jpeg, image/gif" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="primary-color" className="block text-sm font-medium text-gray-700">Couleur principale</label>
                                    <input type="color" id="primary-color" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})} className="mt-1 h-10 w-20 rounded-md border-gray-300 p-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* ... etc ... */}
                </div>
                <div className="mt-8 text-right">
                    <button type="submit" disabled={isSaving} className="bg-yellow-500 text-white px-8 py-3 rounded-full font-bold hover:bg-yellow-600 transition-colors text-lg disabled:opacity-50">
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Le reste du fichier DashboardLayout (Sidebar, Routes, etc.) reste identique...
// ...
export default function DashboardLayout() {
    const { user, isLoaded } = useUser();

    if (!isLoaded) {
        return <div className="p-8">Chargement de votre espace...</div>;
    }

    const isAdmin = user?.organizationMemberships?.some(
        (mem) => mem.role === 'org:admin'
    );

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
                {/* ... */}
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                 <Routes>
                    {isAdmin ? (
                        <>
                            <Route path="/stats" element={<div>Stats</div>} />
                            <Route path="/settings" element={<PageSettings />} />
                            <Route path="/team" element={<div>Team</div>} />
                            <Route path="/menu" element={<div>Menu</div>} />
                            <Route path="*" element={<Navigate to="/settings" replace />} />
                        </>
                    ) : (
                        <>
                           <Route path="/my-stats" element={<div>My Stats</div>} />
                           <Route path="*" element={<Navigate to="/my-stats" replace />} />
                        </>
                    )}
                </Routes>
            </main>
        </div>
    );
}

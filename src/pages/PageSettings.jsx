import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import { QrCode, ExternalLink, Copy } from 'lucide-react';

export default function PageSettings() {
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

            const jwtTemplateName = import.meta.env.VITE_CLERK_JWT_TEMPLATE_NAME;
            if (!jwtTemplateName) {
                setError("Le nom du modèle JWT (VITE_CLERK_JWT_TEMPLATE_NAME) n'est pas configuré dans .env.local");
                setIsLoading(false);
                return;
            }

            try {
                const token = await getToken({ template: jwtTemplateName });
                
                if (!apiUrl) {
                    throw new Error("L'URL de l'API n'est pas configurée. Vérifiez votre fichier .env.local");
                }
                const response = await fetch(`${apiUrl}/api/v1/restaurant/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Impossible de charger les paramètres.');
                }
                
                const data = await response.json();
                setSettings(data);
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
    }, [getToken]);

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
            const jwtTemplateName = import.meta.env.VITE_CLERK_JWT_TEMPLATE_NAME;
            const token = await getToken({ template: jwtTemplateName });
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

            if (!response.ok) throw new Error('La sauvegarde a échoué.');
            
            const result = await response.json();
            if (result.logoUrl) {
                 setLogoPreview(`${apiUrl}${result.logoUrl}`);
            }
            alert('Paramètres enregistrés avec succès !');

        } catch (err) {
            setError(err.message);
            alert(`Erreur: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDownloadQRCode = () => {
        const canvas = qrCodeRef.current.querySelector('canvas');
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `qrcode-${settings.slug}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };
    
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Lien copié !');
        }).catch(err => {
            console.error('Échec de la copie: ', err);
        });
    };

    if (isLoading) return <div className="p-8">Chargement des paramètres...</div>;
    if (error) return <div className="p-8 text-red-500 font-bold">Erreur: {error}</div>;
    if (!settings) return <div className="p-8">Aucun paramètre trouvé.</div>;

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold font-serif mb-8">Personnalisation</h1>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Card: Informations Générales */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-xl font-bold font-serif mb-4">Informations Générales</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="restaurant-name" className="block text-sm font-medium text-gray-700">Nom du Restaurant</label>
                                    <input type="text" id="restaurant-name" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm" />
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
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8">
                             <h2 className="text-xl font-bold font-serif mb-2">Votre Accès Client</h2>
                             <p className="text-sm text-gray-600 mb-4">Vos clients scannent ce code pour laisser un avis.</p>
                             <div className="flex justify-center items-center bg-gray-50 p-4 rounded-lg" ref={qrCodeRef}>
                                <QRCode value={reviewPageUrl} size={200} level={"H"} includeMargin={true} />
                             </div>
                             <button type="button" onClick={handleDownloadQRCode} className="mt-4 w-full bg-gray-800 text-white px-4 py-2 rounded-md font-bold hover:bg-gray-900 flex items-center justify-center gap-2">
                                <QrCode size={16} /> Télécharger
                             </button>
                             <div className="mt-4">
                                <label className="text-sm font-medium text-gray-700">Votre lien direct :</label>
                                <div className="relative mt-1">
                                    <input type="text" readOnly value={reviewPageUrl} className="form-input bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm pr-10" />
                                    <button type="button" onClick={() => copyToClipboard(reviewPageUrl)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-yellow-600">
                                        <Copy size={16} />
                                    </button>
                                </div>
                             </div>
                             <a href={reviewPageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 w-full bg-white text-gray-800 px-4 py-2 rounded-md font-bold border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2">
                                <ExternalLink size={16} /> Aperçu en direct
                             </a>
                        </div>
                    </div>
                </div>
                <div className="mt-8 text-right">
                    <button type="submit" disabled={isSaving} className="bg-yellow-500 text-white px-8 py-3 rounded-full font-bold hover:bg-yellow-600 transition-colors text-lg disabled:opacity-50">
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </form>
        </div>
    );
}

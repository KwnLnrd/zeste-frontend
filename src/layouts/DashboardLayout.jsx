import { useUser, UserButton, useOrganizationList } from '@clerk/clerk-react';
import { BarChart, Users, Settings, Utensils } from 'lucide-react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import PageSettings from '../pages/PageSettings'; // Assurez-vous que ce chemin est correct

// --- Composant de chargement ---
const LoadingComponent = ({ message }) => (
    <div className="p-8 text-center text-gray-600">{message || "Chargement..."}</div>
);

// --- Composant principal du Layout ---
const SidebarLink = ({ to, icon, children }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
                isActive ? 'bg-yellow-50 text-yellow-600 font-bold border-r-4 border-yellow-500' : ''
            }`
        }
    >
        {icon}
        <span>{children}</span>
    </NavLink>
);

export default function DashboardLayout() {
    const { user, isLoaded: isUserLoaded } = useUser();
    const { setActive, isLoaded: isOrgListLoaded, organizationList } = useOrganizationList();

    useEffect(() => {
        // Ne rien faire tant que les données ne sont pas prêtes ou que la liste n'est pas définie
        if (!isUserLoaded || !isOrgListLoaded || !organizationList || !setActive) {
            return;
        }

        // Si l'utilisateur a des organisations mais aucune n'est active, activer la première
        if (organizationList.length > 0 && !user.activeOrganizationId) {
            setActive({ organization: organizationList[0].organization.id });
        }
    }, [isUserLoaded, isOrgListLoaded, organizationList, setActive, user]);

    // --- BLOC DE RENDU SÉCURISÉ ---

    // 1. Attendre que les deux hooks de Clerk soient chargés
    if (!isUserLoaded || !isOrgListLoaded) {
        return <LoadingComponent message="Chargement de votre session..." />;
    }
    
    // 2. Vérifier que la liste des organisations existe bien (anti-crash)
    if (!organizationList) {
        return <LoadingComponent message="Vérification des organisations..." />;
    }

    // 3. Si l'utilisateur n'a aucune organisation, lui dire quoi faire
    if (organizationList.length === 0) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Bienvenue !</h1>
                <p className="mt-2 text-gray-600">Vous n'êtes membre d'aucune organisation. Veuillez en créer une sur votre dashboard Clerk ou demander une invitation.</p>
            </div>
        );
    }

    // 4. Attendre qu'une organisation soit active (le useEffect s'en charge)
    if (!user.activeOrganizationId) {
        return <LoadingComponent message="Activation de votre organisation..." />;
    }

    // Si on arrive ici, tout est prêt. On peut afficher le dashboard.
    const isAdmin = user.organizationMemberships.some(
        (mem) => mem.organization.id === user.activeOrganizationId && mem.role === 'org:admin'
    );

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="h-20 flex items-center justify-center px-4 border-b font-serif text-2xl font-bold">
                    Zeste
                </div>
                <nav className="flex-1 mt-6">
                    {isAdmin ? (
                        <>
                            <SidebarLink to="/stats" icon={<BarChart className="mr-3 h-5 w-5" />}>
                                Statistiques
                            </SidebarLink>
                            <SidebarLink to="/settings" icon={<Settings className="mr-3 h-5 w-5" />}>
                                Personnalisation
                            </SidebarLink>
                            <SidebarLink to="/team" icon={<Users className="mr-3 h-5 w-5" />}>
                                Équipe
                            </SidebarLink>
                            <SidebarLink to="/menu" icon={<Utensils className="mr-3 h-5 w-5" />}>
                                Menu
                            </SidebarLink>
                        </>
                    ) : (
                         <SidebarLink to="/my-stats" icon={<BarChart className="mr-3 h-5 w-5" />}>
                            Mes Stats
                        </SidebarLink>
                    )}
                </nav>
                <div className="p-4 border-t flex items-center space-x-2">
                    <UserButton afterSignOutUrl="/sign-in" />
                    <span className="text-sm font-semibold">{user.firstName || user.primaryEmailAddress.emailAddress}</span>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <Routes>
                    {isAdmin ? (
                        <>
                            <Route path="/stats" element={<div>Page Statistiques</div>} />
                            <Route path="/settings" element={<PageSettings />} />
                            <Route path="/team" element={<div>Page Équipe</div>} />
                            <Route path="/menu" element={<div>Page Menu</div>} />
                            <Route path="*" element={<Navigate to="/stats" replace />} />
                        </>
                    ) : (
                        <>
                            <Route path="/my-stats" element={<div>Mes Statistiques</div>} />
                            <Route path="*" element={<Navigate to="/my-stats" replace />} />
                        </>
                    )}
                </Routes>
            </main>
        </div>
    );
}

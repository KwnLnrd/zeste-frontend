import { useUser, UserButton, useAuth, useOrganizationList } from '@clerk/clerk-react';
import { BarChart, Users, Settings, Utensils } from 'lucide-react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PageSettings from '../pages/PageSettings'; // Assurez-vous d'importer PageSettings

// --- Composant de chargement ---
const LoadingComponent = ({ message }) => (
    <div className="p-8 text-center">{message || "Chargement..."}</div>
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
    const [isOrgReady, setIsOrgReady] = useState(false);

    useEffect(() => {
        // Ne rien faire tant que tout n'est pas chargé
        if (!isUserLoaded || !isOrgListLoaded) {
            return;
        }

        const hasActiveOrganization = !!user.organizationMemberships.find(mem => mem.organization.id === user.activeOrganizationId);

        // Si l'utilisateur a des organisations mais aucune n'est active
        if (organizationList.length > 0 && !hasActiveOrganization) {
            const firstOrgId = organizationList[0].organization.id;
            setActive({ organization: firstOrgId }).then(() => {
                setIsOrgReady(true);
            });
        } else if (organizationList.length > 0) {
            setIsOrgReady(true);
        } else {
            // Gère le cas où l'utilisateur n'a pas d'organisation
            setIsOrgReady(true);
        }

    }, [isUserLoaded, isOrgListLoaded, setActive, user, organizationList]);

    if (!isUserLoaded || !isOrgListLoaded || (organizationList.length > 0 && !isOrgReady)) {
        return <LoadingComponent message="Chargement de votre espace..." />;
    }
    
    // Si l'utilisateur n'a aucune organisation, on lui montre un message
    if (organizationList.length === 0) {
        return <div className="p-8 text-center">Vous n'êtes membre d'aucune organisation. Veuillez en créer une ou demander une invitation.</div>;
    }

    const isAdmin = user?.organizationMemberships?.some(
        (mem) => mem.role === 'org:admin'
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

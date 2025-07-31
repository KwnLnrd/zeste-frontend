import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import DashboardLayout from './layouts/DashboardLayout';
import { useEffect } from 'react';

// Page de chargement pendant que Clerk vérifie la session
function LoadingScreen() {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
}

function App() {
    const { isLoaded, isSignedIn } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        // Rediriger vers le dashboard si l'utilisateur est connecté et sur la page de connexion
        if (isSignedIn && (window.location.pathname.startsWith('/sign-in') || window.location.pathname.startsWith('/sign-up'))) {
            navigate('/');
        }
    }, [isSignedIn, navigate]);

    if (!isLoaded) {
        return <LoadingScreen />;
    }

    return (
        <Routes>
            <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
            <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
            
            <Route path="/*" element={
                isSignedIn ? (
                    <DashboardLayout />
                ) : (
                    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
                    <Navigate to="/sign-in" replace />
                )
            } />
        </Routes>
    );
}

export default App;

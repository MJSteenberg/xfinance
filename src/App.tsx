import { AuthProvider, useAuth } from './hooks/useAuth';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthForms } from './components/AuthForms';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import StatementUpload from './pages/StatementUpload';
import AdminPage from './pages/Admin';
import { useEffect } from 'react';
import './App.css';

// Protected Route wrapper component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" />;
    }
    return <>{children}</>;
}

function AppContent() {
    const { user, isLoading } = useAuth();
    
    // Clear any stored user data on initial mount
    useEffect(() => {
        localStorage.removeItem('user');
    }, []);

    console.log('Current user state:', user);
    console.log('Loading state:', isLoading);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!user) {
        console.log('No user, showing auth forms');
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <AuthForms />
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={<Layout />}>
                <Route index element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="settings" element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                } />
                <Route path="upload" element={
                    <ProtectedRoute>
                        <StatementUpload />
                    </ProtectedRoute>
                } />
                <Route path="admin" element={
                    <ProtectedRoute>
                        <AdminPage />
                    </ProtectedRoute>
                } />
            </Route>
        </Routes>
    );
}

export default function App() {
    console.log('App component rendering');
    return (
        <div className="!min-h-screen !bg-gray-100 !text-black" style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', margin: 0, padding: 0 }}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </div>
    );
}

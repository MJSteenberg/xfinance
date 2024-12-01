// src/hooks/useAuth.ts
import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface User {
    id: string;
    username: string;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = useCallback(async (username: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await invoke<{ success: boolean; data?: User; error?: string }>('login', {
                request: { username, password }
            });

            if (response.success && response.data) {
                setUser(response.data);
                localStorage.setItem('user', JSON.stringify(response.data));
            } else {
                throw new Error(response.error || 'Login failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (username: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await invoke<{ success: boolean; data?: User; error?: string }>('register', {
                request: { username, password }
            });

            if (response.success && response.data) {
                setUser(response.data);
                localStorage.setItem('user', JSON.stringify(response.data));
            } else {
                throw new Error(response.error || 'Registration failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('user');
    }, []);

    // Check for stored user on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const value = {
        user,
        isLoading,
        error,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
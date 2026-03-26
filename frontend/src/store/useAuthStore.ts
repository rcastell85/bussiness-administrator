import { create } from 'zustand';
import client from '../api/client';

interface AuthState {
    user: any | null;
    token: string | null;
    tenantId: string | null;
    isAuthenticated: boolean;
    exchangeRate: number;
    setAuth: (user: any, token: string, tenantId: string) => void;
    logout: () => void;
    fetchExchangeRate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    tenantId: localStorage.getItem('tenantId'),
    isAuthenticated: !!localStorage.getItem('token'),
    exchangeRate: 0,

    setAuth: (user, token, tenantId) => {
        localStorage.setItem('token', token);
        localStorage.setItem('tenantId', tenantId);
        set({ user, token, tenantId, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('tenantId');
        set({ user: null, token: null, tenantId: null, isAuthenticated: false, exchangeRate: 0 });
    },

    fetchExchangeRate: async () => {
        try {
            const { data } = await client.get('/tenants/config/global');
            if (data && data.bcvRate) {
                set({ exchangeRate: Number(data.bcvRate) });
            }
        } catch (err) {
            console.error('Failed to fetch global config', err);
        }
    }
}));

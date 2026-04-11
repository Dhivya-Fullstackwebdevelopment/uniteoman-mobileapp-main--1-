import { create } from 'zustand';
import { authApi } from '../lib/apiClient';
import { storage } from '../lib/storage';
import { User } from '../types';

function decodeToken(token: string): User {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      is_active: true,
    };
  } catch {
    throw new Error('Invalid token');
  }
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  vendorRegister: (payload: {
    email: string;
    password: string;
    full_name: string;
    business_name: string;
    category_id: number;
    location_id: number;
    id_proof_url: string;
    owner_photo_url: string;
    trade_license_url?: string | null;
    address?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false,

  initialize: async () => {
    const token = await storage.getToken();
    if (token) {
      try {
        const user = decodeToken(token);
        // Check token expiry
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)));
        if (payload.exp && Date.now() / 1000 < payload.exp) {
          set({ token, user, isAuthenticated: true, isInitialized: true });
          return;
        }
      } catch {
        // token invalid
      }
      await storage.removeToken();
    }
    set({ isInitialized: true });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { access_token } = await authApi.login({ email, password });
      const user = decodeToken(access_token);
      await storage.setToken(access_token);
      set({ token: access_token, user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  vendorRegister: async (payload) => {
    set({ isLoading: true });
    try {
      // vendor accounts are pending — we get a token but don't auto-login
      await authApi.vendorRegister(payload);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { access_token } = await authApi.register({ email, password });
      const user = decodeToken(access_token);
      await storage.setToken(access_token);
      set({ token: access_token, user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await storage.removeToken();
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

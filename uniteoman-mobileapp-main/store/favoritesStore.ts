import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessCard } from '../types';

const STORAGE_KEY = 'unite_favorites';

interface FavoritesStore {
  favorites: BusinessCard[];
  isInitialized: boolean;
  initialize: () => Promise<void>;
  addFavorite: (business: BusinessCard) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (business: BusinessCard) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],
  isInitialized: false,

  initialize: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const favorites: BusinessCard[] = raw ? JSON.parse(raw) : [];
      set({ favorites, isInitialized: true });
    } catch {
      set({ favorites: [], isInitialized: true });
    }
  },

  addFavorite: async (business: BusinessCard) => {
    const { favorites } = get();
    if (favorites.some(f => f.id === business.id)) return;
    const updated = [business, ...favorites];
    set({ favorites: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  removeFavorite: async (id: string) => {
    const updated = get().favorites.filter(f => f.id !== id);
    set({ favorites: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  isFavorite: (id: string) => get().favorites.some(f => f.id === id),

  toggleFavorite: async (business: BusinessCard) => {
    if (get().isFavorite(business.id)) {
      await get().removeFavorite(business.id);
    } else {
      await get().addFavorite(business);
    }
  },
}));

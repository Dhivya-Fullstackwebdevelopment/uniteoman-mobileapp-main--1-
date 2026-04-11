import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage';
import { API_BASE_URL, ENDPOINTS } from '../constants/api';
import {
  LoginPayload,
  RegisterPayload,
  TokenOut,
  PaginatedBusinesses,
  BusinessCard,
  BusinessDetail,
  Category,
  Governorate,
  ReviewOut,
  ReviewCreate,
  BookingCreate,
  BookingOut,
  BusinessFilters,
  VendorStats,
  ServiceOut,
  ServiceCreate,
} from '../types';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeToken();
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (payload: LoginPayload): Promise<TokenOut> => {
    const { data } = await api.post<TokenOut>(ENDPOINTS.LOGIN, payload);
    return data;
  },
  register: async (payload: RegisterPayload): Promise<TokenOut> => {
    const { data } = await api.post<TokenOut>(ENDPOINTS.REGISTER, payload);
    return data;
  },
  vendorRegister: async (payload: {
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
  }): Promise<TokenOut> => {
    const { data } = await api.post<TokenOut>(ENDPOINTS.VENDOR_REGISTER, payload);
    return data;
  },
};

// ─── BUSINESSES ──────────────────────────────────────────────────────────────
export const businessApi = {
  list: async (filters: BusinessFilters = {}): Promise<PaginatedBusinesses> => {
    const { data } = await api.get<PaginatedBusinesses>(ENDPOINTS.BUSINESSES, {
      params: { per_page: 12, ...filters },
    });
    return data;
  },
  featured: async (limit = 8): Promise<BusinessCard[]> => {
    const { data } = await api.get<BusinessCard[]>(ENDPOINTS.FEATURED_BUSINESSES, {
      params: { limit },
    });
    return data;
  },
  detail: async (slug: string): Promise<BusinessDetail> => {
    const { data } = await api.get<BusinessDetail>(`${ENDPOINTS.BUSINESSES}/${slug}`);
    return data;
  },
  myBusinesses: async (): Promise<BusinessCard[]> => {
    const { data } = await api.get<BusinessCard[]>(ENDPOINTS.MY_BUSINESSES);
    return data;
  },
  me: async (): Promise<BusinessCard[]> => {
    const { data } = await api.get<BusinessCard[]>(ENDPOINTS.MY_BUSINESSES);
    return data;
  },
  myStats: async (): Promise<VendorStats> => {
    const { data } = await api.get<VendorStats>(ENDPOINTS.MY_STATS);
    return data;
  },
  autocomplete: async (q: string): Promise<{ type: string; text: string; slug: string }[]> => {
    const { data } = await api.get(ENDPOINTS.AUTOCOMPLETE, { params: { q } });
    return data;
  },
  update: async (id: string, payload: any): Promise<BusinessCard> => {
    const { data } = await api.patch<BusinessCard>(`${ENDPOINTS.BUSINESSES}/${id}`, payload);
    return data;
  },
};

// ─── CATALOG ─────────────────────────────────────────────────────────────────
export const catalogApi = {
  categories: async (): Promise<Category[]> => {
    const { data } = await api.get<Category[]>(ENDPOINTS.CATEGORIES);
    return data;
  },
  governorates: async (): Promise<Governorate[]> => {
    const { data } = await api.get<Governorate[]>(ENDPOINTS.GOVERNORATES);
    return data;
  },
};

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
export const reviewApi = {
  list: async (businessId: string): Promise<ReviewOut[]> => {
    const { data } = await api.get<ReviewOut[]>(`${ENDPOINTS.REVIEWS}/${businessId}`);
    return data;
  },
  me: async (): Promise<ReviewOut[]> => {
    const { data } = await api.get<ReviewOut[]>(`${ENDPOINTS.REVIEWS}/me`);
    return data;
  },
  create: async (payload: ReviewCreate): Promise<ReviewOut> => {
    const { data } = await api.post<ReviewOut>(ENDPOINTS.REVIEWS, payload);
    return data;
  },
};

// ─── SERVICES ─────────────────────────────────────────────────────────────────
export const serviceApi = {
  listByBusiness: async (businessId: string): Promise<ServiceOut[]> => {
    const { data } = await api.get<ServiceOut[]>(`${ENDPOINTS.SERVICES}/business/${businessId}`);
    return data;
  },
  create: async (payload: ServiceCreate): Promise<ServiceOut> => {
    const { data } = await api.post<ServiceOut>(ENDPOINTS.SERVICES, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${ENDPOINTS.SERVICES}/${id}`);
  },
};

// ─── BOOKINGS ────────────────────────────────────────────────────────────────
export const bookingApi = {
  create: async (payload: BookingCreate): Promise<BookingOut> => {
    const { data } = await api.post<BookingOut>(ENDPOINTS.BOOKINGS, payload);
    return data;
  },
  myBookings: async (): Promise<BookingOut[]> => {
    const { data } = await api.get<BookingOut[]>(ENDPOINTS.MY_BOOKINGS);
    return data;
  },
  vendorList: async (): Promise<BookingOut[]> => {
    const { data } = await api.get<BookingOut[]>(ENDPOINTS.MY_BOOKINGS);
    return data;
  },
  updateStatus: async (id: string, status: string): Promise<BookingOut> => {
    const { data } = await api.put<BookingOut>(`${ENDPOINTS.BOOKINGS}/${id}/status`, { status });
    return data;
  },
};

// ─── COMMON ──────────────────────────────────────────────────────────────────
export const commonApi = {
  upload: async (uri: string, name: string = 'upload.jpg', type: string = 'image/jpeg'): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', { uri, name, type } as any);
    
    const { data } = await api.post<{ url: string }>(ENDPOINTS.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export default api;

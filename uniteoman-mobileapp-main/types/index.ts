export interface User {
  id: string;
  email: string;
  role: 'vendor' | 'admin';
  is_active: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
}

export interface Category {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  icon?: string;
  cover_image_url?: string;
  description?: string;
  business_count: number;
  is_featured: boolean;
  parent_id?: number;
  has_children?: boolean;
}

export interface Governorate {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  emoji?: string;
  business_count: number;
}

export interface BusinessCard {
  id: string;
  name_en: string;
  name_ar?: string;
  slug: string;
  short_description: string;
  category: Category;
  governorate: Governorate;
  logo_url?: string;
  cover_image_url?: string;
  phone?: string;
  whatsapp?: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  plan: 'basic' | 'professional' | 'enterprise';
  listing_type: 'standard' | 'featured' | 'sponsored';
  is_verified: boolean;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  view_count: number;
  gallery_urls: string[];
  tags: string[];
  has_deal: boolean;
  deal_text?: string;
  created_at: string;
}

export interface ServiceOut {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price?: string;
  created_at: string;
}

export interface ServiceCreate {
  business_id: string;
  name: string;
  description?: string;
  price?: string;
}

export interface BusinessDetail extends BusinessCard {
  description?: string;
  email?: string;
  website?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  business_hours?: Record<string, string>;
  services?: ServiceOut[];
}

export interface ReviewOut {
  id: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
  is_verified: boolean;
  created_at: string;
}

export interface ReviewCreate {
  business_id: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
}

export interface BookingCreate {
  business_id: string;
  name: string;
  email: string;
  phone: string;
  service?: string;
  date: string;
  time: string;
}

export interface BookingOut {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string;
  service?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  business_name?: string;
}

export interface PaginatedBusinesses {
  items: BusinessCard[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface VendorStats {
  total_reviews: number;
  avg_rating: number;
  total_services: number;
  total_views: number;
}

export interface BusinessFilters {
  q?: string;
  category?: string;
  governorate?: string;
  featured?: boolean;
  sort?: 'featured' | 'rating' | 'newest' | 'name';
  page?: number;
  per_page?: number;
}

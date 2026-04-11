// Local backend has the count fix (887 correct vs 789,430 bugged on remote)
// Switch back to 72.61.229.172:8090 once SSH access is available to deploy the fix

export const API_BASE_URL = 'http://72.61.229.172:8090';

export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  VENDOR_REGISTER: '/api/auth/vendor-register',

  // Businesses
  BUSINESSES: '/api/businesses',
  FEATURED_BUSINESSES: '/api/businesses/featured',
  MY_BUSINESSES: '/api/businesses/me',
  MY_STATS: '/api/businesses/me/stats',
  AUTOCOMPLETE: '/api/businesses/autocomplete',

  // Catalog
  CATEGORIES: '/api/categories',
  GOVERNORATES: '/api/governorates',

  // Reviews
  REVIEWS: '/api/reviews',

  // Bookings
  BOOKINGS: '/api/bookings',
  MY_BOOKINGS: '/api/bookings/vendor/me',

  // Services
  SERVICES: '/api/services',

  // Upload
  UPLOAD: '/api/upload',

  // Health
  HEALTH: '/api/health',
} as const;

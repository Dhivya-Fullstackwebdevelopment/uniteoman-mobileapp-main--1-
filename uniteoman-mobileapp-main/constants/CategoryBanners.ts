export const CATEGORY_BANNERS: Record<string, any> = {
  'restaurants-cafes': require('../assets/images/categories/restaurants-cafes.png'),
  'beauty-for-women': require('../assets/images/categories/beauty-for-women.png'),
  'grooming-for-men': require('../assets/images/categories/grooming-for-men.png'),
  'fitness-gym': require('../assets/images/categories/fitness-gym.png'),
  'it-software': require('../assets/images/categories/it-software.png'),
  'retail': require('../assets/images/categories/retail.png'),
  'fashion-clothing': require('../assets/images/categories/fashion-clothing.png'),
  'automotive': require('../assets/images/categories/automotive.png'),
  'travel-tourism': require('../assets/images/categories/travel-tourism.png'),
  'spa': require('../assets/images/categories/spa.png'),
  'health-wellness': require('../assets/images/categories/health-wellness.png'),
  'electronics': require('../assets/images/categories/electronics.png'),
  'home-services': require('../assets/images/categories/home-services.png'),
  'cleaning-services': require('../assets/images/categories/cleaning-services.png'),
  'education': require('../assets/images/categories/education.png'),
  'real-estate': require('../assets/images/categories/real-estate.png'),
  'finance': require('../assets/images/categories/finance.png'),

  // Semantic reuses for better coverage
  'food-beverages': require('../assets/images/categories/restaurants-cafes.png'),
  'coffee-cafes': require('../assets/images/categories/restaurants-cafes.png'),
  'pharmacy': require('../assets/images/categories/health-wellness.png'),
  'medical': require('../assets/images/categories/health-wellness.png'),
  'groceries': require('../assets/images/categories/retail.png'),
  'food-delivery': require('../assets/images/categories/restaurants-cafes.png'),
  'logistics': require('../assets/images/categories/automotive.png'),
  'photography': require('../assets/images/categories/it-software.png'), // Will fallback to gradient if events-entertainment missing, or I can use IT-Software for digital feel
  'construction': require('../assets/images/categories/home-services.png'),

  // Additional semantic reuses for missing cards from UI
  'car-rental': require('../assets/images/categories/automotive.png'),
  'car-repair': require('../assets/images/categories/automotive.png'),
  'bakery': require('../assets/images/categories/restaurants-cafes.png'),
  'cafe': require('../assets/images/categories/restaurants-cafes.png'),
  'fast-food': require('../assets/images/categories/restaurants-cafes.png'),
  'food-snacks': require('../assets/images/categories/restaurants-cafes.png'),
  'it-company': require('../assets/images/categories/it-software.png'),
  'clinic': require('../assets/images/categories/health-wellness.png'),
  'health-medical': require('../assets/images/categories/health-wellness.png'),
  'supermarket': require('../assets/images/categories/retail.png'),

  // Exact slugs from backend API for missing elements
  'electronic': require('../assets/images/categories/electronics.png'),
  'restaurants': require('../assets/images/categories/restaurants-cafes.png'),
  'health': require('../assets/images/categories/health-wellness.png'),
  'restaurants-muscat': require('../assets/images/categories/restaurants-cafes.png'),
};


export function getCategoryBanner(slug: string) {
  return CATEGORY_BANNERS[slug] || null;
}

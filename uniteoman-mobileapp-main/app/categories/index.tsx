import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../../lib/apiClient';
import { Colors } from '../../constants/Colors';
import { Category } from '../../types';
import { getCategoryBanner } from '../../constants/CategoryBanners';
import { THEME } from '@/components/Reuse.tsx/Reusecolor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_PADDING = 20;
//const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;
// Slug → Ionicons icon map
const CATEGORY_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  'restaurants-cafes': 'restaurant-outline',
  'food-beverages': 'restaurant-outline',
  'coffee-cafes': 'cafe-outline',
  'grooming-for-men': 'cut-outline',
  'beauty-for-women': 'flower-outline',
  'spa': 'color-wand-outline',
  'health-wellness': 'heart-outline',
  'fitness-gym': 'barbell-outline',
  'it-software': 'laptop-outline',
  'electronics': 'hardware-chip-outline',
  'retail': 'bag-handle-outline',
  'fashion-clothing': 'shirt-outline',
  'home-services': 'home-outline',
  'cleaning-services': 'sparkles-outline',
  'automotive': 'car-outline',
  'education': 'school-outline',
  'travel-tourism': 'airplane-outline',
  'real-estate': 'business-outline',
  'finance': 'card-outline',
  'legal-services': 'briefcase-outline',
  'events-entertainment': 'musical-notes-outline',
  'photography': 'camera-outline',
  'food-delivery': 'bicycle-outline',
  'groceries': 'cart-outline',
  'medical': 'medkit-outline',
  'pharmacy': 'medical-outline',
  'construction': 'construct-outline',
  'logistics': 'cube-outline',
};

// Gradient palette (cycles through for each card)
const CARD_GRADIENTS: [string, string][] = [
  ['#6C3AE0', '#9B5FFF'],
  ['#FF6B35', '#FF9A6C'],
  ['#10B981', '#34D399'],
  ['#F59E0B', '#FBBF24'],
  ['#EF4444', '#F87171'],
  ['#3B82F6', '#60A5FA'],
  ['#8B5CF6', '#A78BFA'],
  ['#EC4899', '#F472B6'],
];

function getCategoryIcon(slug: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICON_MAP[slug] ?? 'grid-outline';
}

function getGradient(index: number): [string, string] {
  return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
}

function CategoryGridCard({ category, index }: { category: Category; index: number }) {
  const gradient = getGradient(index);
  const icon = getCategoryIcon(category.slug);
  const banner = getCategoryBanner(category.slug);

  const content = (
    <LinearGradient
      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
      style={styles.cardGradient}
    >
      {/* Category name */}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {category.name_en}
      </Text>

      {/* Business count badge */}
      {category.business_count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{category.business_count} businesses</Text>
        </View>
      )}

      {/* Arrow */}
      <View style={styles.arrowCircle}>
        <Ionicons name="arrow-forward" size={12} color="#000" />
      </View>
    </LinearGradient>
  );

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/category/${category.slug}`)}
    >
      {banner ? (
        <ImageBackground source={banner} style={styles.cardImage} resizeMode="cover">
          {content}
        </ImageBackground>
      ) : (
        <View style={[styles.cardPlaceholder, { backgroundColor: gradient[0] }]}>
          <LinearGradient colors={gradient} style={styles.cardGradient}>
            {content}
          </LinearGradient>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function CategoriesScreen() {
  const C = Colors;

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: catalogApi.categories,
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: C.background }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>All Categories</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Subtitle ── */}
      <View style={styles.subtitleRow}>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
          {isLoading ? 'Loading...' : `${categories?.length ?? 0} categories available`}
        </Text>
      </View>

      {/* ── Grid ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>
            Loading categories...
          </Text>
        </View>
      ) : (
        // <FlatList
        //   data={categories ?? []}
        //   keyExtractor={(item) => String(item.id)}
        //   numColumns={2}
        //   contentContainerStyle={styles.grid}
        //   columnWrapperStyle={styles.row}
        //   showsVerticalScrollIndicator={false}
        //   renderItem={({ item, index }) => (
        //     <CategoryGridCard category={item} index={index} />
        //   )}
        <FlatList
          data={categories ?? []}
          keyExtractor={(item) => String(item.id)}
          numColumns={1} // <--- Change this from 2 to 1
          contentContainerStyle={styles.grid}
          // columnWrapperStyle={styles.row} // <--- Remove or Comment this out (not used for 1 column)
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <CategoryGridCard category={item} index={index} />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="grid-outline" size={56} color={C.border} />
              <Text style={[styles.emptyTitle, { color: C.text }]}>No Categories</Text>
              <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
                Categories will appear here once added.
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },

  // Subtitle
  subtitleRow: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Grid
  grid: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16
  },
  cardImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    flex: 1,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
  },
  // Decorative circles
  cardDecor: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cardDecor2: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Icon
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emojiIcon: {
    fontSize: 26,
  },

  // Text
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },

  // Count badge
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  countText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Arrow
  arrowCircle: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

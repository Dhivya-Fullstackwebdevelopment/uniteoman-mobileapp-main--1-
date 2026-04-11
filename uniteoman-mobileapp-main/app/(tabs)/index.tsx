import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  FlatList,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { businessApi, catalogApi } from '../../lib/apiClient';
import { Colors, Gradients } from '../../constants/Colors';
import { API_BASE_URL } from '../../constants/api';
import { BusinessCard as BusinessCardType } from '../../types';
import { useSidebarStore } from '../../store/sidebarStore';
import ShelfCard, { buildImageUrl } from '../../components/ShelfCard';

// Slug → Ionicons icon map for the category grid
const CATEGORY_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  'restaurants-cafes':    'restaurant-outline',
  'food-beverages':       'restaurant-outline',
  'coffee-cafes':         'cafe-outline',
  'grooming-for-men':     'cut-outline',
  'beauty-for-women':     'flower-outline',
  'spa':                  'color-wand-outline',
  'health-wellness':      'heart-outline',
  'fitness-gym':          'barbell-outline',
  'it-software':          'laptop-outline',
  'electronics':          'hardware-chip-outline',
  'retail':               'bag-handle-outline',
  'fashion-clothing':     'shirt-outline',
  'home-services':        'home-outline',
  'cleaning-services':    'sparkles-outline',
  'automotive':           'car-outline',
  'education':            'school-outline',
  'travel-tourism':       'airplane-outline',
  'real-estate':          'business-outline',
  'finance':              'card-outline',
  'legal-services':       'briefcase-outline',
  'events-entertainment': 'musical-notes-outline',
  'photography':          'camera-outline',
  'food-delivery':        'bicycle-outline',
  'groceries':            'cart-outline',
  'medical':              'medkit-outline',
  'pharmacy':             'medical-outline',
  'construction':         'construct-outline',
  'logistics':            'cube-outline',
};

// Category accent colors for visual variety
const CATEGORY_COLORS: Record<string, string> = {
  'restaurants-cafes':    '#EF4444',
  'coffee-cafes':         '#92400E',
  'grooming-for-men':     '#1D4ED8',
  'beauty-for-women':     '#BE185D',
  'spa':                  '#7C3AED',
  'health-wellness':      '#059669',
  'fitness-gym':          '#D97706',
  'it-software':          '#0284C7',
  'retail':               '#B45309',
  'fashion-clothing':     '#9333EA',
  'home-services':        '#0891B2',
  'automotive':           '#475569',
  'travel-tourism':       '#0EA5E9',
};

function getCategoryIcon(slug: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICON_MAP[slug] ?? 'grid-outline';
}
function getCategoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] ?? Colors.primary;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function TopRatedCard({ business }: { business: BusinessCardType }) {
  const C = Colors;
  const coverUri = buildImageUrl(business.cover_image_url);

  return (
    <TouchableOpacity
      style={styles.trCard}
      onPress={() => router.push(`/business/${business.slug}`)}
      activeOpacity={0.92}
    >
      <View style={styles.trImageWrapper}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.trImage} resizeMode="cover" />
        ) : (
          <View style={[styles.trImage, { backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="business" size={40} color={C.primary} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(15,23,42,0.55)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Rating badge */}
        <View style={styles.trRatingBadge}>
          <Ionicons name="star" size={11} color="#FFF" />
          <Text style={styles.trRatingText}>{business.rating_avg.toFixed(1)}</Text>
        </View>
        {/* Heart icon */}
        <TouchableOpacity style={styles.trHeartBtn}>
          <Ionicons name="heart-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.trInfo}>
        <Text style={[styles.trName, { color: C.text }]} numberOfLines={1}>
          {business.name_en}
        </Text>
        <View style={styles.trLocationRow}>
          <View style={[styles.trLocationDot, { backgroundColor: C.primary }]} />
          <Text style={[styles.trLocation, { color: C.textSecondary }]} numberOfLines={1}>
            {business.governorate?.name_en}
          </Text>
        </View>
        {business.rating_count > 0 && (
          <View style={styles.trExtraRow}>
            <View style={styles.trAvatarsPlaceholder}>
              <View style={[styles.trMiniAvatar, { backgroundColor: '#C7D2FE' }]} />
              <View style={[styles.trMiniAvatar, { backgroundColor: '#FCE7F3', marginLeft: -8 }]} />
            </View>
            <Text style={[styles.trExtraText, { color: C.textMuted }]}>
              {business.rating_count}+ Bookings this month
            </Text>
          </View>
        )}
        {business.tags && business.tags.length > 0 && (
          <View style={[styles.trTagBadge, { backgroundColor: C.primaryBg }]}>
            <Text style={[styles.trTagText, { color: C.primary }]}>
              {business.tags[0]}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { openSidebar } = useSidebarStore();
  const C = Colors;

  const { data: featured, refetch: refetchFeatured } = useQuery({
    queryKey: ['featured-businesses'],
    queryFn: () => businessApi.featured(8),
  });

  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.categories(),
  });

  const { data: topRated, refetch: refetchTopRated } = useQuery({
    queryKey: ['top-rated'],
    queryFn: () => businessApi.list({ sort: 'rating', per_page: 8 }),
  });

  const { data: newData, refetch: refetchNew } = useQuery({
    queryKey: ['home-new'],
    queryFn: () => businessApi.list({ sort: 'newest', per_page: 8 }),
  });

  const { data: techData, refetch: refetchTech } = useQuery({
    queryKey: ['home-tech'],
    queryFn: () => businessApi.list({ category: 'it-software', per_page: 8 }),
  });

  const { data: homeEssentialsData, refetch: refetchRetail } = useQuery({
    queryKey: ['home-essentials'],
    queryFn: () => businessApi.list({ category: 'retail', per_page: 8 }),
  });

  const { data: groomingData, refetch: refetchGrooming } = useQuery({
    queryKey: ['home-grooming'],
    queryFn: () => businessApi.list({ category: 'grooming-for-men', per_page: 8 }),
  });

  const { data: beautyData, refetch: refetchBeauty } = useQuery({
    queryKey: ['home-beauty'],
    queryFn: () => businessApi.list({ category: 'spa', per_page: 8 }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchFeatured(), refetchCategories(), refetchTopRated(),
      refetchNew(), refetchTech(), refetchRetail(), refetchGrooming(), refetchBeauty(),
    ]);
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuBtn} onPress={openSidebar}>
          <View style={styles.menuLine} />
          <View style={[styles.menuLine, { width: 14 }]} />
        </TouchableOpacity>

        <Text style={[styles.logo, { color: C.text }]}>
          Unite<Text style={{ color: C.primary }}>Oman</Text>
        </Text>

        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={C.text} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* ── Search Bar ──────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/explore')}
          activeOpacity={0.85}
        >
          <View style={styles.searchLeft}>
            <View style={styles.searchIconWrap}>
              <Ionicons name="search" size={17} color={C.primary} />
            </View>
            <Text style={[styles.searchPlaceholder, { color: C.textMuted }]}>
              Search for cleaning, salons…
            </Text>
          </View>
          <View style={[styles.filterBtn, { backgroundColor: C.primary }]}>
            <Ionicons name="options-outline" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* ── Swipable Hero Carousel ──────────────────────────── */}
        {(() => {
          const heroItems =
            featured && featured.length > 0
              ? featured.slice(0, 5)
              : (topRated?.items || []).slice(0, 5);
          if (heroItems.length === 0) return null;

          return (
            <View style={{ marginBottom: 28 }}>
              <FlatList
                data={heroItems}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                snapToInterval={SCREEN_WIDTH - 32}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                renderItem={({ item }) => {
                  const imgUri = buildImageUrl(item.cover_image_url);
                  return (
                    <TouchableOpacity
                      style={[styles.heroCard, { width: SCREEN_WIDTH - 44 }]}
                      onPress={() => router.push(`/business/${item.slug}`)}
                      activeOpacity={0.94}
                    >
                      {imgUri ? (
                        <Image
                          source={{ uri: imgUri }}
                          style={styles.heroImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.heroImage, { backgroundColor: C.primaryBgDeep }]} />
                      )}
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.88)']}
                        style={styles.heroOverlay}
                      >
                        <View style={styles.heroHeader}>
                          {item.category?.name_en && (
                            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1 }]}>
                              <Text style={styles.heroBadgeText}>
                                {item.category.name_en.toUpperCase()}
                              </Text>
                            </View>
                          )}
                          {item.has_deal && (
                            <View style={[styles.heroBadge, { backgroundColor: C.error }]}>
                              <Ionicons name="pricetag" size={9} color="#FFF" />
                              <Text style={styles.heroBadgeText}>OFFER</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.heroTitle} numberOfLines={1}>
                          {item.name_en}
                        </Text>
                        <View style={styles.heroFooter}>
                          <View style={styles.heroRatingRow}>
                            <Ionicons name="star" size={12} color={C.accent} />
                            <Text style={styles.heroRatingText}>
                              {item.rating_avg.toFixed(1)}
                            </Text>
                          </View>
                          <Text style={styles.heroSub} numberOfLines={1}>
                            {item.short_description || 'Premium service provider'}
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          );
        })()}

        {/* ── Explore Categories ──────────────────────────────── */}
        {categories && categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Categories</Text>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push('/categories')}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAll, { color: C.primary }]}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color={C.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories.filter((c) => c.is_featured).slice(0, 10)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const color = getCategoryColor(item.slug);
                return (
                  <TouchableOpacity
                    style={styles.catItem}
                    onPress={() => router.push(`/category/${item.slug}`)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.catCircle, { backgroundColor: `${color}15` }]}>
                      <Ionicons
                        name={getCategoryIcon(item.slug)}
                        size={22}
                        color={color}
                      />
                    </View>
                    <Text style={[styles.catName, { color: C.textSecondary }]} numberOfLines={2}>
                      {item.name_en}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* ── Shelves ─────────────────────────────────────────── */}
        <View style={{ paddingBottom: 100 }}>
          {/* Trending */}
          {topRated?.items && topRated.items.length > 0 && (
            <View style={styles.shelfSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: C.text }]}>Trending</Text>
                  <Text style={[styles.sectionSub, { color: C.textMuted }]}>Most popular this week</Text>
                </View>
              </View>
              <FlatList
                data={topRated.items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
                snapToInterval={SCREEN_WIDTH * 0.65 + 14}
                decelerationRate="fast"
                renderItem={({ item }) => <ShelfCard business={item} />}
              />
            </View>
          )}

          {/* New */}
          {newData?.items && newData.items.length > 0 && (
            <View style={styles.shelfSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: C.text }]}>Just Added</Text>
                  <Text style={[styles.sectionSub, { color: C.textMuted }]}>Fresh listings near you</Text>
                </View>
              </View>
              <FlatList
                data={newData.items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
                snapToInterval={SCREEN_WIDTH * 0.65 + 14}
                decelerationRate="fast"
                renderItem={({ item }) => <ShelfCard business={item} badge="New" />}
              />
            </View>
          )}

          {/* Beauty */}
          {beautyData?.items && beautyData.items.length > 0 && (
            <View style={styles.shelfSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: C.text }]}>Beauty & Wellness</Text>
                  <Text style={[styles.sectionSub, { color: C.textMuted }]}>Spas & salons for women</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/category/spa')}>
                  <Text style={[styles.seeAll, { color: C.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={beautyData.items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
                snapToInterval={SCREEN_WIDTH * 0.65 + 14}
                decelerationRate="fast"
                renderItem={({ item }) => <ShelfCard business={item} />}
              />
            </View>
          )}

          {/* Tech */}
          {techData?.items && techData.items.length > 0 && (
            <View style={styles.shelfSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: C.text }]}>Tech & Software</Text>
                  <Text style={[styles.sectionSub, { color: C.textMuted }]}>IT services & solutions</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/category/it-software')}>
                  <Text style={[styles.seeAll, { color: C.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={techData.items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
                snapToInterval={SCREEN_WIDTH * 0.65 + 14}
                decelerationRate="fast"
                renderItem={({ item }) => <ShelfCard business={item} />}
              />
            </View>
          )}

          {/* Home Essentials */}
          {homeEssentialsData?.items && homeEssentialsData.items.length > 0 && (
            <View style={styles.shelfSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: C.text }]}>Home Essentials</Text>
                  <Text style={[styles.sectionSub, { color: C.textMuted }]}>Retail & home services</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/category/retail')}>
                  <Text style={[styles.seeAll, { color: C.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={homeEssentialsData.items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
                snapToInterval={SCREEN_WIDTH * 0.65 + 14}
                decelerationRate="fast"
                renderItem={({ item }) => <ShelfCard business={item} />}
              />
            </View>
          )}

          {/* Grooming */}
          {groomingData?.items && groomingData.items.length > 0 && (
            <View style={styles.shelfSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: C.text }]}>Grooming for Men</Text>
                  <Text style={[styles.sectionSub, { color: C.textMuted }]}>Barbershops & salons</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/category/grooming-for-men')}>
                  <Text style={[styles.seeAll, { color: C.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={groomingData.items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
                snapToInterval={SCREEN_WIDTH * 0.65 + 14}
                decelerationRate="fast"
                renderItem={({ item }) => <ShelfCard business={item} />}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/explore')}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={Gradients.primary}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="search" size={22} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    gap: 5,
  },
  menuLine: {
    height: 2,
    width: 20,
    backgroundColor: Colors.text,
    borderRadius: 2,
  },
  logo: { fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  notifBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 8,
    justifyContent: 'space-between',
    shadowColor: Colors.shadowNeutral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  searchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPlaceholder: { fontSize: 14, fontWeight: '500' },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
  section: { marginBottom: 28 },
  shelfSection: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAll: { fontSize: 13, fontWeight: '600' },

  // Categories
  catItem: { alignItems: 'center', width: 72 },
  catCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  catName: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 15 },

  // Hero Carousel
  heroCard: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 200,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroRatingText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // Top Rated Card
  trCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  trImageWrapper: { position: 'relative' },
  trImage: {
    width: '100%',
    height: 190,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  trRatingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 3,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  trRatingText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  trHeartBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trInfo: { padding: 16 },
  trName: { fontSize: 17, fontWeight: '700', marginBottom: 8, letterSpacing: -0.2 },
  trLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  trLocationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trLocation: { fontSize: 13, fontWeight: '500' },
  trExtraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  trAvatarsPlaceholder: { flexDirection: 'row' },
  trMiniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  trExtraText: { fontSize: 12, fontWeight: '500' },
  trTagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 2,
  },
  trTagText: { fontSize: 11, fontWeight: '700' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 26,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

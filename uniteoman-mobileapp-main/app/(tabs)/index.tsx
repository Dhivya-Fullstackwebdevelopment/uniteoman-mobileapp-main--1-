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
import { BusinessCard as BusinessCardType } from '../../types';
import { useSidebarStore } from '../../store/sidebarStore';
import ShelfCard from '../../components/ShelfCard';

const CATEGORY_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  'restaurants-cafes': 'restaurant-outline',
  'food-beverages': 'restaurant-outline',
  'coffee-cafes': 'cafe-outline',
  'grooming-for-men': 'cut-outline',
  'beauty-for-women': 'flower-outline',
  spa: 'color-wand-outline',
  'health-wellness': 'heart-outline',
  'fitness-gym': 'barbell-outline',
  'it-software': 'laptop-outline',
  electronics: 'hardware-chip-outline',
  retail: 'bag-handle-outline',
  'fashion-clothing': 'shirt-outline',
  'home-services': 'home-outline',
  'cleaning-services': 'sparkles-outline',
  automotive: 'car-outline',
  education: 'school-outline',
  'travel-tourism': 'airplane-outline',
  'real-estate': 'business-outline',
  finance: 'card-outline',
  'legal-services': 'briefcase-outline',
  'events-entertainment': 'musical-notes-outline',
  photography: 'camera-outline',
  'food-delivery': 'bicycle-outline',
  groceries: 'cart-outline',
  medical: 'medkit-outline',
  pharmacy: 'medical-outline',
  construction: 'construct-outline',
  logistics: 'cube-outline',
};

const CATEGORY_COLORS: Record<string, string> = {
  'restaurants-cafes': '#EF4444',
  'coffee-cafes': '#92400E',
  'grooming-for-men': '#1D4ED8',
  'beauty-for-women': '#BE185D',
  spa: '#7C3AED',
  'health-wellness': '#059669',
  'fitness-gym': '#D97706',
  'it-software': '#0284C7',
  retail: '#B45309',
  'fashion-clothing': '#9333EA',
  'home-services': '#0891B2',
  automotive: '#475569',
  'travel-tourism': '#0EA5E9',
};

function getCategoryIcon(slug: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICON_MAP[slug] ?? 'grid-outline';
}
function getCategoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] ?? Colors.primary;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Standard vertical-stack shelf section ────────────────────────────────────
interface ShelfSectionProps {
  title: string;
  subtitle: string;
  items: BusinessCardType[];
  seeAllRoute?: string;
  badge?: string;
}

function ShelfSection({ title, subtitle, items, seeAllRoute, badge }: ShelfSectionProps) {
  const C = Colors;
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.shelfSection}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: C.text }]}>{title}</Text>
          <Text style={[styles.sectionSub, { color: C.textMuted }]}>{subtitle}</Text>
        </View>
        {seeAllRoute && (
          <TouchableOpacity onPress={() => router.push(seeAllRoute as any)}>
            <Text style={[styles.seeAll, { color: C.primary }]}>See all</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.cardList}>
        {items.map((item, i) => (
          <ShelfCard key={String(item.id)} business={item} badge={badge} index={i} />
        ))}
      </View>
    </View>
  );
}

interface RoundShelfSectionProps {
  title: string;
  subtitle: string;
  items: BusinessCardType[];
  seeAllRoute?: string;
}

function RoundShelfSection({ title, subtitle, items, seeAllRoute }: RoundShelfSectionProps) {
  const C = Colors;
  if (!items || items.length === 0) return null;

  const rows: BusinessCardType[][] = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3));
  }

  return (
    <View style={styles.shelfSection}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: C.text }]}>{title}</Text>
          <Text style={[styles.sectionSub, { color: C.textMuted }]}>{subtitle}</Text>
        </View>
        {seeAllRoute && (
          <TouchableOpacity onPress={() => router.push(seeAllRoute as any)}>
            <Text style={[styles.seeAll, { color: C.primary }]}>See all →</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.roundGrid}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.roundRow}>
            {row.map((item, ci) => (
              <ShelfCard
                key={String(item.id)}
                business={item}
                index={ri * 3 + ci}
                round
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { openSidebar } = useSidebarStore();
  const C = Colors;

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
    queryFn: () => businessApi.list({ category: 'retail', per_page: 9 }), // multiples of 3
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
      refetchCategories(),
      refetchTopRated(),
      refetchNew(),
      refetchTech(),
      refetchRetail(),
      refetchGrooming(),
      refetchBeauty(),
    ]);
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuBtn} onPress={openSidebar}>
          <View style={styles.menuLine} />
          <View style={[styles.menuLine, { width: 14 }]} />
        </TouchableOpacity>

        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 120, height: 40, resizeMode: 'contain' }}
        />

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
                      <Ionicons name={getCategoryIcon(item.slug)} size={22} color={color} />
                    </View>
                    <Text
                      style={[styles.catName, { color: C.textSecondary }]}
                      numberOfLines={2}
                    >
                      {item.name_en}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        <View style={{ paddingBottom: 110 }}>
          <ShelfSection
            title="Trending"
            subtitle="Most popular this week"
            items={topRated?.items ?? []}
          />

          <ShelfSection
            title="Just Added"
            subtitle="Fresh listings near you"
            items={newData?.items ?? []}
            badge="New"
          />

          <ShelfSection
            title="Beauty & Wellness"
            subtitle="Spas & salons for women"
            items={beautyData?.items ?? []}
            seeAllRoute="/category/spa"
          />

          <ShelfSection
            title="Tech & Software"
            subtitle="IT services & solutions"
            items={techData?.items ?? []}
            seeAllRoute="/category/it-software"
          />

          <RoundShelfSection
            title="Home Essentials"
            subtitle="Retail & home services"
            items={homeEssentialsData?.items ?? []}
            seeAllRoute="/category/retail"
          />

          <ShelfSection
            title="Grooming for Men"
            subtitle="Barbershops & salons"
            items={groomingData?.items ?? []}
            seeAllRoute="/category/grooming-for-men"
          />
        </View>
      </ScrollView>

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

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuBtn: { width: 36, height: 36, justifyContent: 'center', gap: 5 },
  menuLine: { height: 2, width: 20, backgroundColor: Colors.text, borderRadius: 2 },
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

  section: { marginBottom: 28 },
  shelfSection: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: 13, fontWeight: '600' },

  cardList: { paddingHorizontal: 16 },

  roundGrid: {
    paddingHorizontal: 16,
    gap: 24,
  },
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

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
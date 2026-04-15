import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { businessApi } from '../../lib/apiClient';
import { Colors } from '../../constants/Colors';
import ShelfCard from '../../components/ShelfCard';
import { THEME } from '@/components/Reuse.tsx/Reusecolor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_HERO_MAP: Record<string, string> = {
  'spa': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80',
  'cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=1200&q=80',
  'it-software': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80',
  'grooming-for-men': 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1200&q=80',
  'retail': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
  'car-rental': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=80',
  'photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80',
};

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?w=1200&q=80';

// ── Category accent color map ─────────────────────────────────────────────────
const CATEGORY_ACCENT: Record<string, { color: string; bg: string; icon: string }> = {
  'spa':             { color: '#A855F7', bg: '#FAF5FF', icon: 'flower-outline' },
  'cleaning':        { color: '#0EA5E9', bg: '#E0F2FE', icon: 'sparkles-outline' },
  'it-software':     { color: '#6366F1', bg: '#EEF2FF', icon: 'code-slash-outline' },
  'grooming-for-men':{ color: '#F59E0B', bg: '#FFFBEB', icon: 'cut-outline' },
  'retail':          { color: '#EC4899', bg: '#FDF2F8', icon: 'bag-outline' },
  'car-rental':      { color: '#10B981', bg: '#ECFDF5', icon: 'car-outline' },
  'photography':     { color: '#EF4444', bg: '#FEF2F2', icon: 'camera-outline' },
};

const FALLBACK_ACCENT = { color: '#4338CA', bg: '#EEF2FF', icon: 'grid-outline' };

// ── Section header sub-component ─────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  accent,
  badge,
  onSeeAll,
}: {
  icon: string;
  title: string;
  accent: { color: string; bg: string };
  badge?: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={sh.row}>
      <View style={sh.left}>
        <View style={[sh.iconBox, { backgroundColor: accent.bg }]}>
          <Ionicons name={icon as any} size={16} color={accent.color} />
        </View>
        <Text style={sh.title}>{title}</Text>
        {badge && (
          <View style={[sh.badge, { backgroundColor: accent.bg }]}>
            <Text style={[sh.badgeText, { color: accent.color }]}>{badge}</Text>
          </View>
        )}
      </View>
      {onSeeAll && (
        <TouchableOpacity style={[sh.seeAllBtn, { borderColor: accent.color + '30' }]} onPress={onSeeAll}>
          <Text style={[sh.seeAllText, { color: accent.color }]}>See all</Text>
          <Ionicons name="chevron-forward" size={12} color={accent.color} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  seeAllText: { fontSize: 12, fontWeight: '700' },
});

// ── Loading shelf skeleton ────────────────────────────────────────────────────
function LoadingShelf() {
  return (
    <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 12 }}>
      {[0, 1].map((i) => (
        <View
          key={i}
          style={{
            width: SCREEN_WIDTH * 0.62,
            height: 220,
            borderRadius: 20,
            backgroundColor: Colors.divider,
          }}
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type SortKey = 'rating' | 'newest' | 'popular';

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'rating',   label: 'Top Rated', icon: 'star' },
  { key: 'newest',   label: 'Newest',    icon: 'time-outline' },
  { key: 'popular',  label: 'Popular',   icon: 'flame-outline' },
];

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams();
  const C = Colors;
  const insets = useSafeAreaInsets();
  const [activeSort, setActiveSort] = useState<SortKey>('rating');

  const categoryStr = String(slug);
  const heroUrl = CATEGORY_HERO_MAP[categoryStr] || FALLBACK_HERO;
  const accent = CATEGORY_ACCENT[categoryStr] || FALLBACK_ACCENT;

  const formatTitle = (s: string) =>
    s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const { data: topRated, isLoading: topLoading } = useQuery({
    queryKey: ['category-top', categoryStr],
    queryFn: () => businessApi.list({ category: categoryStr, sort: 'rating', per_page: 8 }),
  });

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ['category-recent', categoryStr],
    queryFn: () => businessApi.list({ category: categoryStr, sort: 'newest', per_page: 8 }),
  });

  const totalCount =
    (topRated?.total ?? topRated?.items?.length ?? 0);

  const goExplore = () =>
    router.push({ pathname: '/(tabs)/explore', params: { category: categoryStr } });

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Hero ──────────────────────────────────────────────── */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: heroUrl }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.82)']}
            style={styles.heroOverlay}
          >
            {/* Nav */}
            <View style={[styles.headerNav, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} onPress={goExplore}>
                <Ionicons name="search" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Bottom text */}
            <View style={styles.heroBottom}>
              {/* Category label pill */}
              <View style={[styles.categoryPill, { backgroundColor: accent.color }]}>
                <Ionicons name={accent.icon as any} size={11} color="#FFF" />
                <Text style={styles.categoryPillText}>
                  {formatTitle(categoryStr).toUpperCase()}
                </Text>
              </View>

              <Text style={styles.heroTitle}>{formatTitle(categoryStr)}</Text>
              <Text style={styles.heroSub}>
                Discover the finest curated selections
              </Text>

              {/* Count pill */}
              {totalCount > 0 && (
                <View style={styles.countPill}>
                  <Ionicons name="business-outline" size={13} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.countText}>{totalCount} businesses</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* ── Sort chips ────────────────────────────────────────── */}
        <View style={[styles.sortRow, { backgroundColor: C.card }]}>
          <Text style={[styles.sortLabel, { color: C.textMuted }]}>Sort by</Text>
          {SORT_OPTIONS.map((opt) => {
            const active = activeSort === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.sortChip,
                  active
                    ? { backgroundColor: accent.bg, borderColor: accent.color }
                    : { backgroundColor: C.divider, borderColor: C.border },
                ]}
                onPress={() => setActiveSort(opt.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={13}
                  color={active ? accent.color : C.textMuted}
                />
                <Text
                  style={[
                    styles.sortChipText,
                    { color: active ? accent.color : C.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.content}>
          {/* ── Top Rated Section ─────────────────────────────── */}
          <View style={styles.shelfSection}>
            <SectionHeader
              icon="star"
              title="Top Rated"
              accent={accent}
              badge={topRated?.items?.length ? `${topRated.items.length}` : undefined}
              onSeeAll={goExplore}
            />
            {topLoading ? (
              <LoadingShelf />
            ) : topRated?.items && topRated.items.length > 0 ? (
              <FlatList
                data={topRated.items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                snapToInterval={SCREEN_WIDTH * 0.65 + 12}
                decelerationRate="fast"
                renderItem={({ item }) => <ShelfCard business={item} />}
              />
            ) : (
              <View style={styles.emptyShelf}>
                <Ionicons name="star-outline" size={28} color={C.textMuted} />
                <Text style={[styles.emptyShelfText, { color: C.textMuted }]}>
                  No top-rated businesses yet
                </Text>
              </View>
            )}
          </View>

          {/* ── Recently Added Section ────────────────────────── */}
          <View style={styles.shelfSection}>
            <SectionHeader
              icon="time-outline"
              title="Recently Added"
              accent={{ color: '#10B981', bg: '#ECFDF5' }}
              badge={recent?.items?.length ? `${recent.items.length}` : undefined}
              onSeeAll={goExplore}
            />
            {recentLoading ? (
              <LoadingShelf />
            ) : recent?.items && recent.items.length > 0 ? (
              <FlatList
                data={recent.items}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                snapToInterval={SCREEN_WIDTH * 0.65 + 12}
                decelerationRate="fast"
                renderItem={({ item }) => <ShelfCard business={item} badge="New" />}
              />
            ) : (
              <View style={styles.emptyShelf}>
                <Ionicons name="time-outline" size={28} color={C.textMuted} />
                <Text style={[styles.emptyShelfText, { color: C.textMuted }]}>
                  No recent businesses yet
                </Text>
              </View>
            )}
          </View>

          {/* ── Explore All CTA ───────────────────────────────── */}
          {(topRated?.items?.length || recent?.items?.length) ? (
            <View style={{ paddingHorizontal: 20 }}>
              <TouchableOpacity
                style={[styles.exploreAllBtn, { borderColor: accent.color + '40' }]}
                onPress={goExplore}
                activeOpacity={0.8}
              >
                <View style={[styles.exploreAllIcon, { backgroundColor: THEME.primary }]}>
                  <Ionicons name="grid-outline" size={18} color={accent.color} />
                </View>
                <Text style={[styles.exploreAllText, { color: C.text }]}>
                  Explore all{' '}
                  <Text style={{ color: accent.color }}>
                    {formatTitle(categoryStr)}
                  </Text>{' '}
                  listings
                </Text>
                <Ionicons name="chevron-forward" size={18} color={accent.color} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ── Full empty state ──────────────────────────────── */}
          {!topLoading &&
            !recentLoading &&
            !topRated?.items?.length &&
            !recent?.items?.length && (
              <View style={[styles.emptyState, { backgroundColor: C.card }]}>
                <View style={[styles.emptyIconWrap, { backgroundColor: accent.bg }]}>
                  <Ionicons name={accent.icon as any} size={36} color={accent.color} />
                </View>
                <Text style={[styles.emptyTitle, { color: C.text }]}>Nothing here yet</Text>
                <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                  No businesses have been listed in {formatTitle(categoryStr)} yet.{'\n'}
                  Check back soon!
                </Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: accent.color }]}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.emptyBtnText}>Explore Other Categories</Text>
                </TouchableOpacity>
              </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero
  heroContainer: { height: 380, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroBottom: { alignItems: 'flex-start' },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryPillText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '700',
  },

  // Sort row
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  sortLabel: { fontSize: 12, fontWeight: '600', marginRight: 2 },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  sortChipText: { fontSize: 12, fontWeight: '700' },

  // Content
  content: { paddingTop: 28 },
  shelfSection: { marginBottom: 36 },

  // Empty shelf
  emptyShelf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.divider,
  },
  emptyShelfText: { fontSize: 14, fontWeight: '500' },

  // Explore all CTA
  exploreAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  exploreAllIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreAllText: { flex: 1, fontSize: 14, fontWeight: '600' },

  // Full empty state
  emptyState: {
    margin: 20,
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});

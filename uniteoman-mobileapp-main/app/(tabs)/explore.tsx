import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { businessApi, catalogApi } from '../../lib/apiClient';
import { Colors } from '../../constants/Colors';
import SearchBar from '../../components/SearchBar';
import BusinessCard from '../../components/BusinessCard';
import LoadingScreen from '../../components/LoadingScreen';
import { BusinessFilters } from '../../types';
import { THEME } from '@/components/Reuse.tsx/Reusecolor';

type SortOption = 'featured' | 'rating' | 'newest' | 'name';

const SORT_OPTIONS: { key: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'featured', label: 'Featured', icon: 'star-outline' },
  { key: 'rating', label: 'Top Rated', icon: 'trophy-outline' },
  { key: 'newest', label: 'Newest', icon: 'sparkles-outline' },
  { key: 'name', label: 'A–Z', icon: 'text-outline' },
];

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ category?: string; governorate?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(params.category);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string | undefined>(
    params.governorate,
  );
  const [sort, setSort] = useState<SortOption>('featured');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const C = Colors;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedGovernorate, sort]);

  const filters: BusinessFilters = {
    q: debouncedQuery || undefined,
    category: selectedCategory,
    governorate: selectedGovernorate,
    sort,
    page,
    per_page: 12,
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['businesses', filters],
    queryFn: () => businessApi.list(filters),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: catalogApi.categories,
  });

  const { data: governorates } = useQuery({
    queryKey: ['governorates'],
    queryFn: catalogApi.governorates,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedGovernorate(undefined);
    setSort('featured');
    setPage(1);
  };

  const hasActiveFilters = selectedCategory || selectedGovernorate || sort !== 'featured';
  const activeFilterCount =
    (selectedCategory ? 1 : 0) + (selectedGovernorate ? 1 : 0) + (sort !== 'featured' ? 1 : 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: C.text }]}>Explore</Text>
          <Text style={[styles.headerSub, { color: C.textMuted }]}>Find the best in Oman</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.filterToggleBtn,
            {
              backgroundColor: hasActiveFilters ? THEME.primary : C.card,
              borderColor: hasActiveFilters ? THEME.primary : C.border,
            },
          ]}
          onPress={() => setShowFilters((v) => !v)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={hasActiveFilters ? '#FFF' : C.text}
          />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: hasActiveFilters ? 'rgba(255,255,255,0.35)' : C.error }]}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ─────────────────────────────────────────── */}
      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search businesses, services..."
        />
      </View>

      {/* ── Filter Panel ───────────────────────────────────────── */}
      {showFilters && (
        <View style={[styles.filterPanel, { backgroundColor: C.card, borderColor: C.border }]}>
          {/* Sort */}
          <Text style={[styles.filterLabel, { color: C.textMuted }]}>Sort By</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: sort === opt.key ? THEME.primary : C.background,
                    borderColor: sort === opt.key ? THEME.primary : C.border,
                  },
                ]}
                onPress={() => setSort(opt.key)}
              >
                <Ionicons
                  name={opt.icon}
                  size={13}
                  color={sort === opt.key ? '#FFF' : C.textSecondary}
                />
                <Text style={[styles.chipText, { color: sort === opt.key ? '#FFF' : C.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Category filter */}
          {categories && (
            <>
              <Text style={[styles.filterLabel, { color: C.textMuted }]}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    {
                      backgroundColor: !selectedCategory ? THEME.primary : C.background,
                      borderColor: !selectedCategory ? THEME.primary : C.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(undefined)}
                >
                  <Text style={[styles.chipText, { color: !selectedCategory ? '#FFF' : C.text }]}>
                    All
                  </Text>
                </TouchableOpacity>
                {categories.slice(0, 12).map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selectedCategory === cat.slug ? THEME.primary : C.background,
                        borderColor: selectedCategory === cat.slug ? THEME.primary : C.border,
                      },
                    ]}
                    onPress={() =>
                      setSelectedCategory(selectedCategory === cat.slug ? undefined : cat.slug)
                    }
                  >
                    {cat.icon && <Text style={styles.chipIcon}>{cat.icon}</Text>}
                    <Text
                      style={[
                        styles.chipText,
                        { color: selectedCategory === cat.slug ? '#FFF' : C.text },
                      ]}
                    >
                      {cat.name_en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Governorate filter */}
          {governorates && (
            <>
              <Text style={[styles.filterLabel, { color: C.textMuted }]}>Governorate</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    {
                      backgroundColor: !selectedGovernorate ? THEME.primary : C.background,
                      borderColor: !selectedGovernorate ? THEME.primary : C.border,
                    },
                  ]}
                  onPress={() => setSelectedGovernorate(undefined)}
                >
                  <Text
                    style={[styles.chipText, { color: !selectedGovernorate ? '#FFF' : C.text }]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {governorates.map((gov) => (
                  <TouchableOpacity
                    key={gov.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedGovernorate === gov.slug ? THEME.primary : C.background,
                        borderColor: selectedGovernorate === gov.slug ? THEME.primary : C.border,
                      },
                    ]}
                    onPress={() =>
                      setSelectedGovernorate(
                        selectedGovernorate === gov.slug ? undefined : gov.slug,
                      )
                    }
                  >
                    {gov.emoji && <Text style={styles.chipIcon}>{gov.emoji}</Text>}
                    <Text
                      style={[
                        styles.chipText,
                        { color: selectedGovernorate === gov.slug ? '#FFF' : C.text },
                      ]}
                    >
                      {gov.name_en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
              <View style={[styles.clearFiltersBtnInner, { borderColor: C.error }]}>
                <Ionicons name="close-circle-outline" size={15} color={C.error} />
                <Text style={[styles.clearFiltersText, { color: C.error }]}>
                  Clear All Filters
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Results ────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingScreen message="Searching businesses..." />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BusinessCard
              business={item}
              onPress={() => router.push(`/business/${item.slug}`)}
            />
          )}
          ListHeaderComponent={() => (
            <View style={styles.resultsHeader}>
              <View style={styles.resultsCountRow}>
                {isFetching ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <Text style={[styles.resultsCount, { color: C.textSecondary }]}>
                    {data?.total ?? 0}{' '}
                    <Text style={{ color: C.text, fontWeight: '700' }}>businesses</Text> found
                  </Text>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: THEME.light }]}>
                <Ionicons name="search-outline" size={40} color={THEME.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: C.text }]}>No Businesses Found</Text>
              <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
                Try adjusting your filters or search term
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: THEME.primary }]}
                  onPress={clearFilters}
                >
                  <Text style={styles.emptyBtnText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListFooterComponent={() =>
            data && data.pages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    { backgroundColor: page > 1 ? THEME.primary : C.border },
                    { opacity: page > 1 ? 1 : 0.4 },
                  ]}
                  disabled={page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <Ionicons name="chevron-back" size={18} color="#FFF" />
                </TouchableOpacity>
                <View style={[styles.pageIndicator, { borderColor: C.border }]}>
                  <Text style={[styles.pageText, { color: C.text }]}>
                    {page} / {data.pages}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    { backgroundColor: page < data.pages ? THEME.primary : C.border },
                    { opacity: page < data.pages ? 1 : 0.4 },
                  ]}
                  disabled={page >= data.pages}
                  onPress={() => setPage((p) => p + 1)}
                >
                  <Ionicons name="chevron-forward" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },

  filterToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
    shadowColor: Colors.shadowNeutral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  searchWrapper: { paddingHorizontal: 20, paddingBottom: 14 },

  filterPanel: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipRow: { paddingBottom: 8, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 5,
  },
  chipIcon: { fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: '600' },

  clearFiltersBtn: { marginTop: 10 },
  clearFiltersBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  clearFiltersText: { fontSize: 13, fontWeight: '600' },

  resultsHeader: { paddingHorizontal: 20, paddingVertical: 12 },
  resultsCountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultsCount: { fontSize: 14, fontWeight: '500' },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 36,
    gap: 14,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.2 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 21, fontWeight: '500' },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  pageBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  pageText: { fontSize: 14, fontWeight: '700' },
});

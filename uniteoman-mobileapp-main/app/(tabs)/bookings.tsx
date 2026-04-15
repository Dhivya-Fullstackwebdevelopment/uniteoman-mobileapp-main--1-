import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useAuthStore } from '../../store/authStore';
import { Colors, Gradients } from '../../constants/Colors';
import { BusinessCard } from '../../types';
import { API_BASE_URL } from '../../constants/api';
import { THEME } from '@/components/Reuse.tsx/Reusecolor';

const { width: W } = Dimensions.get('window');
const CARD_WIDTH = (W - 48) / 2;

const C = Colors;

function buildUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('file')) return url;
  const path = url.startsWith('/') ? url.slice(1) : url;
  return `${API_BASE_URL}/${path}`;
}

// ── Favorite card (grid layout) ───────────────────────────────────────────────
function FavCard({ item, onRemove }: { item: BusinessCard; onRemove: () => void }) {
  const cover = buildUrl(item.cover_image_url) ?? buildUrl(item.logo_url);

  return (
    <TouchableOpacity
      style={[styles.favCard, { backgroundColor: C.card }]}
      onPress={() => router.push(`/business/${item.slug}`)}
      activeOpacity={0.88}
    >
      {/* Cover image */}
      <View style={styles.coverWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
        ) : (
          <LinearGradient colors={Gradients.primary} style={styles.cover}>
            <Ionicons name="business" size={30} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={StyleSheet.absoluteFill}
        />
        {/* Remove button */}
        <TouchableOpacity style={styles.heartBtn} onPress={onRemove} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Ionicons name="heart" size={17} color="#EF4444" />
        </TouchableOpacity>
        {/* Rating chip */}
        {item.rating_avg > 0 && (
          <View style={styles.ratingChip}>
            <Ionicons name="star" size={9} color="#FBBF24" />
            <Text style={styles.ratingText}>{item.rating_avg.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: C.text }]} numberOfLines={1}>
          {item.name_en}
        </Text>
        <Text style={[styles.cardCategory, { color: C.textMuted }]} numberOfLines={1}>
          {item.category?.name_en ?? '—'}
        </Text>
        {item.governorate?.name_en && (
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={10} color={C.textMuted} />
            <Text style={[styles.locText, { color: C.textMuted }]} numberOfLines={1}>
              {item.governorate.name_en}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Empty states ──────────────────────────────────────────────────────────────
function GuestEmpty() {
  return (
    <View style={styles.centerEmpty}>
      <LinearGradient colors={[THEME.light, THEME.light]} style={[styles.emptyIconWrap, { backgroundColor: THEME.light }]}>
        <Ionicons name="heart-outline" size={44} color={THEME.primary} />
      </LinearGradient>
      <Text style={[styles.emptyTitle, { color: C.text }]}>Save your favourites</Text>
      <Text style={[styles.emptySub, { color: C.textSecondary }]}>
        Sign in to bookmark salons, restaurants, and services you love.
      </Text>
      <TouchableOpacity style={styles.ctaWrap} onPress={() => router.push('/(auth)/login')}>
        <LinearGradient colors={THEME.darkGradient}  style={styles.ctaBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.ctaText}>Sign In</Text>
          <Ionicons name="arrow-forward" size={15} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function NoFavorites() {
  return (
    <View style={styles.centerEmpty}>
      <LinearGradient colors={['#FDF2F8', '#FCE7F3']} style={styles.emptyIconWrap}>
        <Ionicons name="heart-dislike-outline" size={44} color="#EC4899" />
      </LinearGradient>
      <Text style={[styles.emptyTitle, { color: C.text }]}>No favourites yet</Text>
      <Text style={[styles.emptySub, { color: C.textSecondary }]}>
        Tap the ♡ on any business to save it here for quick access.
      </Text>
      <TouchableOpacity style={styles.ctaWrap} onPress={() => router.push('/(tabs)/explore')}>
        <LinearGradient colors={THEME.gradient} style={styles.ctaBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.ctaText}>Explore Businesses</Text>
          <Ionicons name="search" size={15} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function FavoritesScreen() {
  const { isAuthenticated } = useAuthStore();
  const { favorites, initialize, removeFavorite } = useFavoritesStore();

  useEffect(() => { initialize(); }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: C.text }]}>Favourites</Text>
          {isAuthenticated && favorites.length > 0 && (
            <Text style={[styles.headerSub, { color: C.textMuted }]}>
              {favorites.length} saved {favorites.length === 1 ? 'place' : 'places'}
            </Text>
          )}
        </View>
        <View style={[styles.heartIconBox, { backgroundColor: '#FDF2F8' }]}>
          <Ionicons name="heart" size={22} color="#EC4899" />
        </View>
      </View>

      {/* ── Content ───────────────────────────────────────────────── */}
      {!isAuthenticated ? (
        <GuestEmpty />
      ) : favorites.length === 0 ? (
        <NoFavorites />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FavCard
              item={item}
              onRemove={() => removeFavorite(item.id)}
            />
          )}
          ListHeaderComponent={
            <View style={[styles.sortBar, { backgroundColor: C.divider }]}>
              <Ionicons name="time-outline" size={14} color={C.textMuted} />
              <Text style={[styles.sortText, { color: C.textMuted }]}>Recently saved</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  heartIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  sortBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, marginBottom: 12, alignSelf: 'flex-start',
  },
  sortText: { fontSize: 11, fontWeight: '600' },

  columnWrapper: { gap: 12, marginBottom: 12 },

  // Fav card
  favCard: {
    width: CARD_WIDTH, borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  coverWrap: { height: 120, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  cover: { ...StyleSheet.absoluteFillObject },
  heartBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  ratingChip: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  ratingText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  cardBody: { padding: 10, paddingTop: 8 },
  cardName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  cardCategory: { fontSize: 11, fontWeight: '500', marginBottom: 3 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText: { fontSize: 10, fontWeight: '500' },

  // Empty
  centerEmpty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 14,
  },
  emptyIconWrap: {
    width: 96, height: 96, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 21, fontWeight: '500' },
  ctaWrap: { marginTop: 4, alignSelf: 'stretch', borderRadius: 14, overflow: 'hidden' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  ctaText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});

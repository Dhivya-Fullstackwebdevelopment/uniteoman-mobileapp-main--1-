import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '../constants/Colors';
import { BusinessCard as BusinessCardType } from '../types';
import StarRating from './StarRating';
import { API_BASE_URL } from '../constants/api';

interface Props {
  business: BusinessCardType;
  onPress: () => void;
  horizontal?: boolean;
}

function buildImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
}

export default function BusinessCard({ business, onPress, horizontal = false }: Props) {
  const C = Colors;
  const coverUri = buildImageUrl(business.cover_image_url);
  const logoUri = buildImageUrl(business.logo_url);

  if (horizontal) {
    return (
      <TouchableOpacity
        style={[styles.hCard, { backgroundColor: C.card }]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <View style={styles.hImageWrapper}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.hImage} resizeMode="cover" />
          ) : (
            <View style={[styles.hImage, styles.imagePlaceholder]}>
              <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
              <Ionicons name="business" size={24} color="rgba(255,255,255,0.7)" />
            </View>
          )}
          {/* Badges */}
          <View style={styles.badgeContainer}>
            {business.is_featured && (
              <View style={[styles.badge, { backgroundColor: Colors.featuredBadge }]}>
                <Text style={styles.badgeText}>Featured</Text>
              </View>
            )}
            {business.has_deal && (
              <View style={[styles.badge, { backgroundColor: Colors.dealBadge }]}>
                <Ionicons name="pricetag" size={9} color="#FFF" />
                <Text style={styles.badgeText}>Deal</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.hInfo}>
          <Text style={[styles.hName, { color: C.text }]} numberOfLines={1}>
            {business.name_en}
          </Text>
          <View style={styles.hMeta}>
            <Text style={[styles.hCategory, { color: C.primary }]} numberOfLines={1}>
              {business.category?.name_en}
            </Text>
            {business.is_verified && (
              <Ionicons name="checkmark-circle" size={13} color={Colors.verifiedBadge} />
            )}
          </View>
          <View style={styles.ratingRow}>
            <StarRating rating={business.rating_avg || 0} size={12} />
            <Text style={[styles.ratingCount, { color: C.textMuted }]}>
              ({business.rating_count || 0})
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={C.textMuted} />
            <Text style={[styles.locationText, { color: C.textMuted }]} numberOfLines={1}>
              {business.governorate?.name_en}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.vCard, { backgroundColor: C.card }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Cover */}
      <View style={styles.vImageWrapper}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.vImage} resizeMode="cover" />
        ) : (
          <View style={[styles.vImage, styles.imagePlaceholder]}>
            <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
            <Ionicons name="business" size={40} color="rgba(255,255,255,0.7)" />
          </View>
        )}

        {/* Subtle image gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)']}
          style={styles.imageGradient}
          pointerEvents="none"
        />

        {/* Logo overlay */}
        {logoUri && (
          <View style={[styles.logoWrapper, { borderColor: C.card }]}>
            <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="cover" />
          </View>
        )}

        {/* Top badges */}
        <View style={styles.topBadges}>
          {business.listing_type === 'sponsored' && (
            <View style={[styles.badge, { backgroundColor: Colors.sponsoredBadge }]}>
              <Text style={styles.badgeText}>Sponsored</Text>
            </View>
          )}
          {business.is_featured && (
            <View style={[styles.badge, { backgroundColor: Colors.featuredBadge }]}>
              <Ionicons name="star" size={9} color="#FFF" />
              <Text style={styles.badgeText}>Featured</Text>
            </View>
          )}
        </View>

        {/* Rating on image */}
        <View style={styles.imageRatingBadge}>
          <Ionicons name="star" size={10} color="#FFF" />
          <Text style={styles.imageRatingText}>{(business.rating_avg || 0).toFixed(1)}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.vBody}>
        <View style={styles.vTitleRow}>
          <Text style={[styles.vName, { color: C.text }]} numberOfLines={1}>
            {business.name_en}
          </Text>
          {business.is_verified && (
            <Ionicons name="checkmark-circle" size={16} color={Colors.verifiedBadge} />
          )}
        </View>

        <View style={styles.vMetaRow}>
          <View style={[styles.categoryPill, { backgroundColor: C.primaryBg }]}>
            <Text style={[styles.categoryPillText, { color: C.primary }]}>
              {business.category?.name_en}
            </Text>
          </View>
          <View style={styles.locationPill}>
            <View style={[styles.locationDot, { backgroundColor: C.textMuted }]} />
            <Text style={[styles.locationPillText, { color: C.textMuted }]}>
              {business.governorate?.name_en}
            </Text>
          </View>
        </View>

        {business.short_description ? (
          <Text style={[styles.vDescription, { color: C.textSecondary }]} numberOfLines={2}>
            {business.short_description}
          </Text>
        ) : null}

        <View style={styles.vFooter}>
          <View style={styles.ratingRow}>
            <StarRating rating={business.rating_avg || 0} size={13} />
            <Text style={[styles.ratingAvg, { color: C.text }]}>
              {(business.rating_avg || 0).toFixed(1)}
            </Text>
            <Text style={[styles.ratingCount, { color: C.textMuted }]}>
              ({business.rating_count || 0})
            </Text>
          </View>

          {business.has_deal && (
            <View style={[styles.dealBadge, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="pricetag" size={10} color={C.error} />
              <Text style={[styles.dealText, { color: C.error }]}>Deal</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ─── Horizontal card ───────────────────────────────────────
  hCard: {
    width: 200,
    borderRadius: 18,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  hImageWrapper: { position: 'relative' },
  hImage: { width: '100%', height: 128 },
  hInfo: { padding: 12 },
  hName: { fontSize: 14, fontWeight: '700', marginBottom: 3, letterSpacing: -0.1 },
  hMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  hCategory: { fontSize: 12, fontWeight: '600' },

  // ─── Vertical card ─────────────────────────────────────────
  vCard: {
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  vImageWrapper: { position: 'relative' },
  vImage: { width: '100%', height: 178 },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  logoWrapper: {
    position: 'absolute',
    bottom: -18,
    left: 16,
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 2.5,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  logo: { width: '100%', height: '100%' },
  topBadges: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  imageRatingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 9,
    gap: 3,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  imageRatingText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  vBody: { padding: 16, paddingTop: 16 },
  vTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  vName: { fontSize: 17, fontWeight: '700', flex: 1, letterSpacing: -0.2 },
  vMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 22,
  },
  categoryPillText: { fontSize: 12, fontWeight: '600' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationDot: { width: 4, height: 4, borderRadius: 2 },
  locationPillText: { fontSize: 12, fontWeight: '500' },
  vDescription: { fontSize: 13, lineHeight: 20, marginBottom: 12, fontWeight: '400' },
  vFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ─── Shared ────────────────────────────────────────────────
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 5,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingAvg: { fontSize: 13, fontWeight: '700' },
  ratingCount: { fontSize: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  locationText: { fontSize: 12 },
  dealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dealText: { fontSize: 11, fontWeight: '700' },
});

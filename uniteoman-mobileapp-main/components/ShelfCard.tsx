import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BusinessCard as BusinessCardType } from '../types';
import { Colors, Gradients } from '../constants/Colors';
import { API_BASE_URL } from '../constants/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.66;

export function buildImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  const safeUrl = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${safeUrl}`;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80',
  'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
  'https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=600&q=80',
];

interface ShelfCardProps {
  business: BusinessCardType;
  badge?: string;
  index?: number;
}

export default function ShelfCard({ business, badge, index = 0 }: ShelfCardProps) {
  const C = Colors;
  const fallbackImg = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const coverUri = buildImageUrl(business.cover_image_url || business.logo_url) || fallbackImg;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/business/${business.slug}`)}
      activeOpacity={0.92}
    >
      {/* Image container */}
      <View style={styles.imageContainer}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
            <Ionicons name="business" size={36} color="rgba(255,255,255,0.7)" />
          </View>
        )}

        {/* Subtle gradient for text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.imageGradient}
          pointerEvents="none"
        />

        {/* Badges top-left */}
        <View style={styles.headerBadges}>
          {badge && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    badge === 'New' ? C.success : C.primary,
                },
              ]}
            >
              {badge === 'New' && (
                <Ionicons name="sparkles" size={9} color="#FFF" />
              )}
              <Text style={styles.badgeText}>{badge.toUpperCase()}</Text>
            </View>
          )}
          {business.has_deal && (
            <View style={[styles.badge, { backgroundColor: C.error }]}>
              <Ionicons name="pricetag" size={9} color="#FFF" />
              <Text style={styles.badgeText}>DEAL</Text>
            </View>
          )}
        </View>

        {/* Rating badge top-right */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={10} color="#FFF" />
          <Text style={styles.ratingText}>{Number(business.rating_avg).toFixed(1)}</Text>
        </View>

        {/* Favorite button */}
        <TouchableOpacity style={styles.favBtn} activeOpacity={0.8}>
          <Ionicons name="heart-outline" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
          {business.name_en}
        </Text>
        <Text style={[styles.desc, { color: C.textSecondary }]} numberOfLines={1}>
          {business.short_description || business.category?.name_en || 'Service Provider'}
        </Text>

        <View style={styles.footer}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: C.primary }]} />
            <Text style={[styles.location, { color: C.textMuted }]} numberOfLines={1}>
              {business.governorate?.name_en || 'Oman'}
            </Text>
          </View>
          {business.rating_count > 0 && (
            <View style={styles.reviewsChip}>
              <Text style={[styles.reviews, { color: C.primary }]}>
                {business.rating_count} reviews
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
    marginVertical: 4,
  },
  imageContainer: {
    height: 155,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },

  // Badges
  headerBadges: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  favBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info section
  info: {
    padding: 14,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: -0.1,
  },
  desc: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 10,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  locationDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  location: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  reviewsChip: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reviews: {
    fontSize: 10,
    fontWeight: '700',
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BusinessCard as BusinessCardType } from '../types';
import { Colors, Gradients } from '../constants/Colors';
import { API_BASE_URL } from '../constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

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
  fullWidth?: boolean;
  
  round?: boolean;
}

export default function ShelfCard({
  business,
  badge,
  index = 0,
  round = false,
}: ShelfCardProps) {
  const C = Colors;
  const fallbackImg = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const coverUri =
    buildImageUrl(business.cover_image_url || business.logo_url) || fallbackImg;

  const hasDiscount = business.has_deal;
 
  const isVerified = (business as any).is_verified ?? false;

  if (round) {
    return (
      <TouchableOpacity
        style={styles.roundCard}
        onPress={() => router.push(`/business/${business.slug}`)}
        activeOpacity={0.88}
      >
        <View style={styles.roundImageWrap}>
          <Image source={{ uri: coverUri }} style={styles.roundImage} resizeMode="cover" />
        </View>
        <Text style={[styles.roundName, { color: C.text }]} numberOfLines={2}>
          {business.name_en}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/business/${business.slug}`)}
      activeOpacity={0.93}
    >
      {/* Image */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: coverUri }} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.18)']}
          style={styles.imageFade}
          pointerEvents="none"
        />

        {/* Top-left badges */}
        <View style={styles.topLeft}>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={11} color="#FFF" />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          )}
          {badge && !isVerified && (
            <View
              style={[
                styles.genericBadge,
                { backgroundColor: badge === 'New' ? C.success : C.primary },
              ]}
            >
              {badge === 'New' && <Ionicons name="sparkles" size={9} color="#FFF" />}
              <Text style={styles.badgeText}>{badge.toUpperCase()}</Text>
            </View>
          )}
          {hasDiscount && (
            <View style={[styles.genericBadge, { backgroundColor: C.error }]}>
              <Ionicons name="pricetag" size={9} color="#FFF" />
              <Text style={styles.badgeText}>DEAL</Text>
            </View>
          )}
        </View>

        {/* Favourite */}
        {/* <TouchableOpacity style={styles.favBtn} activeOpacity={0.8}>
          <Ionicons name="heart-outline" size={18} color="#FFF" />
        </TouchableOpacity> */}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
          {business.name_en}
        </Text>

        <Text style={[styles.desc, { color: C.textSecondary }]} numberOfLines={1}>
          {business.short_description ||
            business.category?.name_en ||
            'Service Provider'}
        </Text>

        {/* rating · reviews · location */}
        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color={C.accent} />
          <Text style={[styles.ratingVal, { color: C.text }]}>
            {Number(business.rating_avg).toFixed(1)}
          </Text>

          {business.rating_count > 0 && (
            <>
              <Text style={[styles.dot, { color: C.textMuted }]}>·</Text>
              <Text style={[styles.reviewCount, { color: C.textMuted }]}>
                {business.rating_count}
              </Text>
            </>
          )}

          {business.governorate?.name_en && (
            <>
              <Text style={[styles.dot, { color: C.textMuted }]}>·</Text>
              <Ionicons name="location-outline" size={12} color={C.textMuted} />
              <Text style={[styles.location, { color: C.textMuted }]} numberOfLines={1}>
                {business.governorate.name_en}
              </Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ROUND_SIZE = Math.floor((SCREEN_WIDTH - 32 - 24) / 3);

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 5,
  },
  imageWrap: {
    width: '100%',
    height: 210,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  image: { width: '100%', height: '100%' },
  imageFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  topLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  genericBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  favBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 5,
  },
  name: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  desc: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingVal: { fontSize: 13, fontWeight: '700' },
  dot: { fontSize: 13, fontWeight: '600' },
  reviewCount: { fontSize: 13, fontWeight: '500' },
  location: { fontSize: 13, fontWeight: '500', flexShrink: 1 },

  roundCard: {
    alignItems: 'center',
    width: ROUND_SIZE,
  },
  roundImageWrap: {
    width: ROUND_SIZE,
    height: ROUND_SIZE,
    borderRadius: ROUND_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  roundImage: { width: '100%', height: '100%' },
  roundName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
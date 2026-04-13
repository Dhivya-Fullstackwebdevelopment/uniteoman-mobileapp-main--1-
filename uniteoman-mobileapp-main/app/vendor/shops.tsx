import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { businessApi } from '../../lib/apiClient';
import { Colors } from '../../constants/Colors';
import { BusinessCard } from '../../types';
import { API_BASE_URL } from '../../constants/api';
import { THEME } from '@/components/Reuse.tsx/Reusecolor';

function buildUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('file')) return url;
  const path = url.startsWith('/') ? url.slice(1) : url;
  return `${API_BASE_URL}/${path}`;
}

function StatusBadge({ status }: { status: BusinessCard['status'] }) {
  const isPending = status === 'pending';
  const isActive = status === 'active';
  const color = isActive ? '#10B981' : isPending ? '#F59E0B' : '#EF4444';
  const bg = isActive ? '#D1FAE5' : isPending ? '#FEF3C7' : '#FEE2E2';

  return (
    <View style={[{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }]}>
      <Text style={{ color, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>{status}</Text>
    </View>
  );
}

export default function VendorShopsScreen() {
  const { data: shops, isLoading } = useQuery({
    queryKey: ['vendor-shops'],
    queryFn: () => businessApi.me(),
  });

  const C = Colors;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.background }]} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={[styles.pageTitle, { color: C.text }]}>My Shops</Text>

      {(!shops || shops.length === 0) ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: C.divider }]}>
            <Ionicons name="business" size={32} color={C.textMuted} />
          </View>
          <Text style={[styles.emptyText, { color: C.text }]}>No shops found</Text>
          <Text style={[styles.emptySub, { color: C.textSecondary }]}>You don't have any businesses listed yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {shops.map((shop) => (
            <View key={shop.id} style={[styles.shopCard, { backgroundColor: C.card }]}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.logoBox, { borderColor: C.divider }]}>
                   {shop.logo_url ? <Image source={{ uri: buildUrl(shop.logo_url) }} style={styles.image} /> : <Ionicons name="storefront-outline" size={24} color={C.textMuted} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.shopName, { color: C.text }]} numberOfLines={1}>{shop.name_en}</Text>
                  <Text style={[styles.shopCategory, { color: C.textSecondary }]}>{shop.category?.name_en} • {shop.governorate?.name_en}</Text>
                </View>
                <StatusBadge status={shop.status} />
              </View>

              <View style={[styles.divider, { backgroundColor: C.divider }]} />

              {/* Engagement Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: C.text }]}>{shop.view_count}</Text>
                  <Text style={[styles.statLabel, { color: C.textMuted }]}>Profile Views</Text>
                </View>
                <View style={styles.statBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={[styles.statValue, { color: C.text }]}>{shop.rating_avg.toFixed(1)}</Text>
                  </View>
                  <Text style={[styles.statLabel, { color: C.textMuted }]}>{shop.rating_count} Reviews</Text>
                </View>
                <View style={[styles.actionsBox, { flex: 1, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }]}>
                   <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: THEME.light, borderRadius: 8 }} onPress={() => router.push(`/business/${shop.slug}`)}>
                     <Text style={{ color: THEME.primary, fontSize: 12, fontWeight: '700' }}>View</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: THEME.primary, borderRadius: 8 }} onPress={() => router.push(`/vendor/edit-shop/${shop.id}`)}>
                     <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Edit</Text>
                   </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  pageTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  shopCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  shopName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  shopCategory: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginVertical: 16, opacity: 0.5 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  statBox: { gap: 4 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  actionsBox: { justifyContent: 'center' },
});

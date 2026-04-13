import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { businessApi, bookingApi } from '../../lib/apiClient';
import { Colors, Gradients } from '../../constants/Colors';
import { BusinessCard } from '../../types';
import { API_BASE_URL } from '../../constants/api';
import { THEME } from '@/components/Reuse.tsx/Reusecolor';

function buildUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('file')) return url;
  const path = url.startsWith('/') ? url.slice(1) : url;
  return `${API_BASE_URL}/${path}`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Status badge sub-component ────────────────────────────────────────────────
function StatusBadge({ status }: { status: BusinessCard['status'] }) {
  const map: Record<string, { color: string; bg: string; dot: string }> = {
    active: { color: '#059669', bg: '#D1FAE5', dot: '#10B981' },
    pending: { color: '#D97706', bg: '#FEF3C7', dot: '#F59E0B' },
    suspended: { color: '#DC2626', bg: '#FEE2E2', dot: '#EF4444' },
    rejected: { color: '#DC2626', bg: '#FEE2E2', dot: '#EF4444' },
  };
  const s = map[status] ?? map.pending;
  return (
    <View style={[badge.wrap, { backgroundColor: s.bg }]}>
      <View style={[badge.dot, { backgroundColor: s.dot }]} />
      <Text style={[badge.text, { color: s.color }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize', letterSpacing: 0.3 },
});

// ── Section header sub-component ──────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  action,
  actionLabel,
  iconBg,
  iconColor,
}: {
  icon: string;
  title: string;
  action?: () => void;
  actionLabel?: string;
  iconBg?: string;
  iconColor?: string;
}) {
  const C = Colors;
  return (
    <View style={sectionH.row}>
      <View style={sectionH.left}>
        <View style={[sectionH.iconBox, { backgroundColor: iconBg || C.primaryBg }]}>
          <Ionicons name={icon as any} size={16} color={iconColor || C.primary} />
        </View>
        <Text style={[sectionH.title, { color: C.text }]}>{title}</Text>
      </View>
      {action && (
        <TouchableOpacity onPress={action}>
          <Text style={[sectionH.seeAll, { color: iconColor || C.primary }]}>
            {actionLabel || 'See all'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sectionH = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '800' },
  seeAll: { fontSize: 13, fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────

export default function VendorDashboardScreen() {
  const C = Colors;
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: shops, isLoading: shopsLoading, refetch: refetchShops } = useQuery({
    queryKey: ['vendor-shops'],
    queryFn: () => businessApi.me(),
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: () => businessApi.myStats(),
  });

  const { data: bookings, refetch: refetchBookings } = useQuery({
    queryKey: ['vendor-bookings'],
    queryFn: () => bookingApi.vendorList(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchShops(), refetchStats(), refetchBookings()]);
    setRefreshing(false);
  };

  if (shopsLoading || statsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const statCards = [
    {
      label: 'Profile Views',
      value: stats?.total_views ?? 0,
      icon: 'eye-outline',
      color: '#3B82F6',
      bg: '#EFF6FF',
      suffix: '',
    },
    {
      label: 'Avg Rating',
      value: stats?.avg_rating?.toFixed(1) ?? '0.0',
      icon: 'star',
      color: '#F59E0B',
      bg: '#FFFBEB',
      suffix: '',
    },
    {
      label: 'Reviews',
      value: stats?.total_reviews ?? 0,
      icon: 'chatbubble-ellipses-outline',
      color: '#10B981',
      bg: '#ECFDF5',
      suffix: '',
    },
    {
      label: 'Services',
      value: stats?.total_services ?? 0,
      icon: 'color-wand-outline',
      color: '#A855F7',
      bg: '#FAF5FF',
      suffix: '',
    },
  ];

  const quickActions = [
    {
      icon: 'add-circle-outline',
      label: 'Add Service',
      color: '#8B5CF6',
      bg: '#EDE9FE',
      onPress: () => router.push('/vendor/services'),
    },
    {
      icon: 'calendar-outline',
      label: 'Appointments',
      color: '#0EA5E9',
      bg: '#E0F2FE',
      onPress: () => router.push('/vendor/appointments'),
    },
    {
      icon: 'star-outline',
      label: 'Reviews',
      color: '#F59E0B',
      bg: '#FFFBEB',
      onPress: () => router.push('/vendor/reviews'),
    },
    {
      icon: 'settings-outline',
      label: 'Settings',
      color: '#6B7280',
      bg: '#F3F4F6',
      onPress: () => router.push('/vendor/settings'),
    },
  ];

  const pendingBookings = bookings?.filter((b) => b.status === 'pending') ?? [];
  const recentBookings = bookings?.slice(0, 3) ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* ── Header ──────────────────────────────────────────────── */}
      <LinearGradient
        colors={THEME.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles */}
        <View style={[styles.circle, { top: -30, right: -20, width: 120, height: 120, opacity: 0.1 }]} />
        <View style={[styles.circle, { top: 40, right: 40, width: 50, height: 50, opacity: 0.09 }]} />

        {/* Top row */}
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.headerTitle}>Vendor Dashboard</Text>
            <Text style={styles.headerSub}>Here's what's happening today</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
            {pendingBookings.length > 0 && (
              <View style={styles.notifDot}>
                <Text style={styles.notifCount}>
                  {pendingBookings.length > 9 ? '9+' : pendingBookings.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          {statCards.map((s, i) => (
            <View key={i} style={[styles.statItem, i < statCards.length - 1 && styles.statDivider]}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Ionicons name={s.icon as any} size={14} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
      >
        {/* ── Pending alert ──────────────────────────────────────── */}
        {pendingBookings.length > 0 && (
          <TouchableOpacity
            style={[styles.alertBanner, { backgroundColor: C.warningBg, borderColor: '#FCD34D' }]}
            onPress={() => router.push('/vendor/appointments')}
            activeOpacity={0.8}
          >
            <View style={[styles.alertIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="calendar" size={18} color={C.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 14 }}>
                {pendingBookings.length} Pending Booking
                {pendingBookings.length > 1 ? 's' : ''}
              </Text>
              <Text style={{ color: '#B45309', fontSize: 12, marginTop: 1 }}>
                Tap to review and confirm
              </Text>
            </View>
            <View style={[styles.alertChevron, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="chevron-forward" size={15} color={C.warning} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Quick Actions ──────────────────────────────────────── */}
        <SectionHeader
          icon="flash-outline"
          title="Quick Actions"
          iconBg="#EDE9FE"
          iconColor="#8B5CF6"
        />
        <View style={styles.quickGrid}>
          {quickActions.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quickCard, { backgroundColor: C.card }]}
              onPress={a.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.quickLabel, { color: C.text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {a.label}
                </Text>
              </View>
              <View style={[styles.quickChevron, { backgroundColor: a.bg }]}>
                <Ionicons name="chevron-forward" size={12} color={a.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent Bookings ────────────────────────────────────── */}
        {recentBookings.length > 0 && (
          <>
            <SectionHeader
              icon="calendar-outline"
              title="Recent Bookings"
              iconBg="#E0F2FE"
              iconColor="#0EA5E9"
              action={() => router.push('/vendor/appointments')}
              actionLabel="View all"
            />
            <View style={styles.bookingsCard}>
              {recentBookings.map((booking: any, i: number) => {
                const statusMap: Record<string, { color: string; bg: string }> = {
                  pending: { color: '#D97706', bg: '#FEF3C7' },
                  confirmed: { color: '#059669', bg: '#D1FAE5' },
                  cancelled: { color: '#DC2626', bg: '#FEE2E2' },
                  completed: { color: '#6366F1', bg: '#EEF2FF' },
                };
                const s = statusMap[booking.status] || statusMap.pending;
                return (
                  <View
                    key={booking.id}
                    style={[
                      styles.bookingRow,
                      i < recentBookings.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: C.divider,
                      },
                    ]}
                  >
                    <View style={[styles.bookingDot, { backgroundColor: s.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bookingName, { color: C.text }]} numberOfLines={1}>
                        {booking.customer_name || booking.service?.name || 'Booking'}
                      </Text>
                      <Text style={[styles.bookingTime, { color: C.textMuted }]}>
                        {booking.date || booking.created_at?.slice(0, 10) || '—'}
                      </Text>
                    </View>
                    <View style={[styles.bookingStatus, { backgroundColor: s.bg }]}>
                      <Text style={[styles.bookingStatusText, { color: s.color }]}>
                        {booking.status}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── My Shops ───────────────────────────────────────────── */}
        <SectionHeader
          icon="business-outline"
          title="My Shops"
          iconBg={C.primaryBg}
          iconColor={C.primary}
          action={() => router.push('/vendor/shops')}
          actionLabel="See all"
        />

        {!shops || shops.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: C.card }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: C.primaryBg }]}>
              <Ionicons name="business-outline" size={34} color={C.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text }]}>No shops listed yet</Text>
            <Text style={[styles.emptySub, { color: C.textMuted }]}>
              Contact support to register your first business
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {shops.map((shop) => {
              const cover = buildUrl(shop.cover_image_url || shop.logo_url);
              return (
                <View key={shop.id} style={[styles.shopCard, { backgroundColor: C.card }]}>
                  {/* Cover */}
                  {cover ? (
                    <Image source={{ uri: cover }} style={styles.shopCover} resizeMode="cover" />
                  ) : (
                    <LinearGradient
                      colors={Gradients.primary}
                      style={[styles.shopCover, { alignItems: 'center', justifyContent: 'center' }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="business" size={36} color="rgba(255,255,255,0.7)" />
                    </LinearGradient>
                  )}

                  {/* Status badge overlay */}
                  <View style={styles.shopStatusOverlay}>
                    <StatusBadge status={shop.status} />
                  </View>

                  {/* Body */}
                  <View style={styles.shopBody}>
                    <Text style={[styles.shopName, { color: C.text }]} numberOfLines={1}>
                      {shop.name_en}
                    </Text>
                    <Text style={[styles.shopMeta, { color: C.textSecondary }]} numberOfLines={1}>
                      {shop.category?.name_en}
                      {shop.governorate?.name_en ? `  ·  ${shop.governorate.name_en}` : ''}
                    </Text>

                    {/* Stats row */}
                    <View style={styles.shopStatsRow}>
                      <View style={[styles.shopStatPill, { backgroundColor: '#FFFBEB' }]}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={[styles.shopStatText, { color: '#92400E' }]}>
                          {shop.rating_avg?.toFixed(1) ?? '—'} ({shop.rating_count ?? 0})
                        </Text>
                      </View>
                      <View style={[styles.shopStatPill, { backgroundColor: C.primaryBg }]}>
                        <Ionicons name="eye-outline" size={12} color={C.primary} />
                        <Text style={[styles.shopStatText, { color: C.primaryDark }]}>
                          {shop.view_count ?? 0} views
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.shopActions}>
                      <TouchableOpacity
                        style={[
                          styles.shopActionBtn,
                          {
                            backgroundColor: THEME.grayLight,
                            borderColor: THEME.grayBorder,
                          }
                        ]}
                        onPress={() => router.push(`/business/${shop.slug}`)}
                      >
                        <Ionicons name="eye-outline" size={14} color={THEME.grayText} />
                        <Text style={[styles.shopActionText, { color: THEME.grayText }]}>
                          Preview
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.shopActionBtn, { backgroundColor: C.primary }]}
                        onPress={() => router.push(`/vendor/edit-shop/${shop.id}`)}
                      >
                        <LinearGradient
                          colors={THEME.darkGradient}
                          style={StyleSheet.absoluteFillObject}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        />
                        <Ionicons name="create-outline" size={14} color="#FFF" />
                        <Text style={[styles.shopActionText, { color: '#FFF' }]}>
                          Edit Shop
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  bellBtn: { position: 'relative', padding: 4 },
  notifDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifCount: { fontSize: 9, fontWeight: '800', color: '#78350F' },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.15)',
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Alert
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  alertIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertChevron: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick actions
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  quickCard: {
    width: '47%',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 13, fontWeight: '700' },
  quickChevron: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Recent bookings card
  bookingsCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  bookingDot: { width: 8, height: 8, borderRadius: 4 },
  bookingName: { fontSize: 13, fontWeight: '700' },
  bookingTime: { fontSize: 11, marginTop: 2 },
  bookingStatus: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookingStatusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },

  // Empty card
  emptyCard: {
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  // Shop cards
  shopCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  shopCover: { width: '100%', height: 148 },
  shopStatusOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  shopBody: { padding: 16 },
  shopName: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  shopMeta: { fontSize: 12, fontWeight: '500', marginBottom: 12 },
  shopStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  shopStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  shopStatText: { fontSize: 11, fontWeight: '700' },
  shopActions: { flexDirection: 'row', gap: 10 },
  shopActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  shopActionText: { fontSize: 13, fontWeight: '700' },
});

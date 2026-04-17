import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, StatusBar, Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { businessApi } from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { Colors, Gradients } from '../../constants/Colors';
import { THEME } from '@/components/Reuse.tsx/Reusecolor';
import Toast from 'react-native-toast-message';

const C = Colors;
const { width: W } = Dimensions.get('window');

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(email?: string): string {
  if (!email) return 'U';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getDisplayName(email?: string): string {
  if (!email) return 'User';
  return email.split('@')[0]
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatJoinDate(id?: string): string {
  // JWT sub is a UUID or numeric id; we can't extract date from it alone, so use "Member" generically
  return 'United Oman Member';
}

// ── Reusable sub-components ───────────────────────────────────────────────────
function StatBox({ value, label, icon, color }: {
  value: string | number; label: string;
  icon: keyof typeof Ionicons.glyphMap; color: string;
}) {
  return (
    <View style={stat.box}>
      <View style={[stat.iconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[stat.value, { color: C.text }]}>{value}</Text>
      <Text style={[stat.label, { color: C.textMuted }]}>{label}</Text>
    </View>
  );
}
const stat = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', gap: 4 },
  iconWrap: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  value: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  label: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});

function MenuItem({ icon, label, value, badge, onPress, danger, last }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  badge?: string | number;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[mi.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.divider }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[mi.iconBox, { backgroundColor: danger ? '#FEE2E2' : THEME.light }]}>
        <Ionicons name={icon} size={17} color={danger ? C.error : THEME.primary} />
      </View>
      <Text style={[mi.label, { color: danger ? C.error : C.text }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {badge !== undefined && (
        <View style={[mi.badge, { backgroundColor: C.primary }]}>
          <Text style={mi.badgeText}>{badge}</Text>
        </View>
      )}
      {value && <Text style={[mi.value, { color: C.textMuted }]}>{value}</Text>}
      {!danger && <Ionicons name="chevron-forward" size={15} color={C.textMuted} />}
    </TouchableOpacity>
  );
}
const mi = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 13,
  },
  iconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '500' },
  value: { fontSize: 12, marginRight: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <Text style={[sec.title, { color: C.textMuted }]}>{title}</Text>
      <View style={[sec.card, { backgroundColor: C.card }]}>{children}</View>
    </View>
  );
}
const sec = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginTop: 20 },
  title: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
});

// ── Guest screen ──────────────────────────────────────────────────────────────
function GuestProfile() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={THEME.gradient}
        style={guestSt.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={guestSt.blob1} />
        <View style={guestSt.blob2} />
        <View style={guestSt.avatarWrap}>
          <View style={guestSt.avatar}>
            <Ionicons name="person-outline" size={46} color="rgba(255,255,255,0.85)" />
          </View>
          <View style={guestSt.guestBadge}>
            <Text style={guestSt.guestBadgeText}>Guest</Text>
          </View>
        </View>
        <Text style={guestSt.title}>Welcome to UniteOman</Text>
        <Text style={guestSt.sub}>
          Sign in to access your profile, favourites, and more.
        </Text>
      </LinearGradient>

      {/* Benefit chips */}
      <View style={guestSt.benefitsRow}>
        {[
          { icon: 'heart-outline' as const, label: 'Save Favourites' },
          { icon: 'person-outline' as const, label: 'Your Profile' },
          { icon: 'star-outline' as const, label: 'Leave Reviews' },
        ].map((b, i) => (
          <View key={i} style={[guestSt.chip, { backgroundColor: C.card }]}>
            <View style={guestSt.chipIcon}>
              <Ionicons name={b.icon} size={16} color={THEME.primary} />
            </View>
            <Text style={[guestSt.chipLabel, { color: C.text }]}>{b.label}</Text>
          </View>
        ))}
      </View>

      <View style={guestSt.btnRow}>
        <TouchableOpacity
          style={[guestSt.btnWrap, { flex: 1.4, borderRadius: 14, overflow: 'hidden' }]}
          onPress={() => router.push('/(auth)/login')}
        >
          <LinearGradient colors={THEME.gradient} style={guestSt.signInBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={guestSt.signInText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={[guestSt.createBtn, { flex: 1, borderColor: THEME.primary }]}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={[guestSt.createText, { color: THEME.darkcolor }]}>Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const guestSt = StyleSheet.create({
  hero: {
    alignItems: 'center', paddingTop: 52, paddingBottom: 52,
    paddingHorizontal: 28, gap: 10, overflow: 'hidden',
  },
  blob1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -50 },
  blob2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 0, left: -30 },
  avatarWrap: { alignItems: 'center', marginBottom: 4 },
  avatar: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  guestBadge: {
    position: 'absolute', bottom: -8,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  guestBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', textAlign: 'center', letterSpacing: -0.3 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.72)', textAlign: 'center', lineHeight: 20 },
  benefitsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, gap: 6, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  chipIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: THEME.light, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 20 },
  btnWrap: {},
  signInBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  signInText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  createBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  createText: { fontSize: 15, fontWeight: '700' },
});

// ══════════════════════════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { favorites } = useFavoritesStore();
  const isVendor = user?.role === 'vendor';
  const [showSignOutModal, setShowSignOutModal] = useState(false);


  const { data: stats } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: businessApi.myStats,
    enabled: isAuthenticated && isVendor,
  });

  const initials = getInitials(user?.email);
  const displayName = getDisplayName(user?.email);

  // const handleLogout = () => {
  //   Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
  //     { text: 'Cancel', style: 'cancel' },
  //     {
  //       text: 'Sign Out', style: 'destructive',
  //       onPress: async () => { await logout(); router.replace('/(auth)/login'); },
  //     },
  //   ]);
  // };

  const handleSignOutPress = () => {
    setShowSignOutModal(true);
  };

  const handleConfirmSignOut = async () => {
    setShowSignOutModal(false);
    await logout();
    router.replace('/(auth)/login');
  };

  if (!isAuthenticated) return <GuestProfile />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* ── Hero header ──────────────────────────────────────────── */}
        <LinearGradient
          // colors={isVendor ? ['#1e1b4b', '#312e81', '#4338CA'] : ['#3730A3', '#4338CA', '#6366F1']}
          colors={THEME.gradient}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Blobs */}
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />

          {/* Top row */}
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLogo}>UniteOman </Text>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          {/* Avatar + info */}
          <View style={styles.heroProfile}>
            <View style={styles.avatarOuter}>
              <LinearGradient
                colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.1)']}
                style={styles.avatar}
              >
                <Text style={styles.avatarLetters}>{initials}</Text>
              </LinearGradient>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.heroEmail}>{user?.email}</Text>
              <View style={styles.roleChip}>
                <Ionicons name={isVendor ? 'business' : 'person'} size={10} color="rgba(255,255,255,0.9)" />
                <Text style={styles.roleChipText}>{isVendor ? 'Vendor Account' : 'Customer'}</Text>
              </View>
            </View>
          </View>

          {/* Stats row */}
          {isVendor ? (
            <View style={styles.statsBar}>
              {[
                { label: 'Views', value: stats?.total_views ?? 0, icon: 'eye-outline' as const, color: '#A5B4FC' },
                { label: 'Rating', value: stats?.avg_rating?.toFixed(1) ?? '0.0', icon: 'star-outline' as const, color: '#FBBF24' },
                { label: 'Reviews', value: stats?.total_reviews ?? 0, icon: 'chatbubble-outline' as const, color: '#34D399' },
                { label: 'Services', value: stats?.total_services ?? 0, icon: 'color-wand-outline' as const, color: '#F9A8D4' },
              ].map((s, i, arr) => (
                <React.Fragment key={s.label}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.statDiv} />}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <View style={styles.statsBar}>
              {[
                { label: 'Favourites', value: favorites.length, icon: 'heart-outline' as const },
                { label: 'Reviews', value: 0, icon: 'star-outline' as const },
                { label: 'Member', value: '✓', icon: 'shield-checkmark-outline' as const },
              ].map((s, i, arr) => (
                <React.Fragment key={s.label}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.statDiv} />}
                </React.Fragment>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* ── Vendor management ────────────────────────────────────── */}
        {isVendor && (
          <Section title="Vendor Management">
            <MenuItem icon="grid-outline" label="Dashboard" onPress={() => router.push('/vendor/dashboard')} />
            <MenuItem icon="business-outline" label="My Shops" onPress={() => router.push('/vendor/shops')} />
            <MenuItem icon="calendar-outline" label="Appointments " onPress={() => router.push('/vendor/appointments')} />
            <MenuItem icon="color-wand-outline" label="Services" onPress={() => router.push('/vendor/services')} />
            <MenuItem icon="star-outline" label="Reviews" onPress={() => router.push('/vendor/reviews')} />
            <MenuItem icon="settings-outline" label="Vendor Settings" onPress={() => router.push('/vendor/settings')} last />
          </Section>
        )}

        {/* ── Customer account ─────────────────────────────────────── */}
        {!isVendor && (
          <Section title="My Account">
            <MenuItem
              icon="heart-outline"
              label="My Favourites"
              badge={favorites.length || undefined}
              onPress={() => router.push('/(tabs)/bookings')}
            />
            <MenuItem icon="star-outline" label="My Reviews" onPress={() => Alert.alert('Coming Soon')} />
            <MenuItem icon="person-outline" label="Edit Profile" onPress={() => Alert.alert('Coming Soon')} />
            <MenuItem icon="card-outline" label="Payment Methods" onPress={() => Alert.alert('Coming Soon')} last />
          </Section>
        )}

        {/* ── App ──────────────────────────────────────────────────── */}
        <Section title="App">
          <MenuItem icon="settings-outline" label="Settings" onPress={() => Alert.alert('Coming Soon')} />
          <MenuItem icon="headset-outline" label="Support" value="support@uniteoman.com" onPress={() => Alert.alert('Support', 'support@uniteoman.com')} />
          <MenuItem icon="information-circle-outline" label="About UniteOman" onPress={() => Alert.alert('Coming Soon')} last />
        </Section>

        {/* ── Sign out ─────────────────────────────────────────────── */}
        <Section title="">
          <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleSignOutPress} danger last />
        </Section>

        <Text style={[styles.version, { color: C.textMuted }]}>UniteOman v1.0.0</Text>
      </ScrollView>
      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: C.card }]}>
            {/* Modal Handle */}
            <View style={[styles.modalHandle, { backgroundColor: C.border }]} />

            {/* Icon */}
            <View style={styles.modalIconContainer}>
              <LinearGradient
                colors={['#FEE2E2', '#FFE4E6']}
                style={styles.modalIconGradient}
              >
                <Ionicons name="log-out-outline" size={40} color={C.error} />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: C.text }]}>Sign Out</Text>

            {/* Message */}
            <Text style={[styles.modalMessage, { color: C.textSecondary }]}>
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </Text>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: C.border }]}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: C.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleConfirmSignOut}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.modalConfirmGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-out-outline" size={18} color="#FFF" />
                  <Text style={styles.modalConfirmText}>Sign Out</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Hero
  hero: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, overflow: 'hidden' },
  heroBlob1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: -50, right: -50 },
  heroBlob2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)', bottom: 0, left: -20 },

  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heroLogo: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  notifBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },

  heroProfile: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatarOuter: { position: 'relative' },
  avatar: {
    width: 76, height: 76, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarLetters: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  onlineDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#ffffff',
  },
  heroInfo: { flex: 1, gap: 5 },
  heroName: { fontSize: 21, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  heroEmail: { fontSize: 12, color: 'rgba(255,255,255,0.68)', fontWeight: '500' },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  roleChipText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.95)' },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 18, paddingVertical: 14, paddingHorizontal: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.4 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontWeight: '600' },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  version: { textAlign: 'center', fontSize: 12, marginTop: 24, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: W - 48,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
  },
  modalIconContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  modalIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    height: 52,
  },
  modalCancelButton: {
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirmButton: {
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  modalConfirmText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

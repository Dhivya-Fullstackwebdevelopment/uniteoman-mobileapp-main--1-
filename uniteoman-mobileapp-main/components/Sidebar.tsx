import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useSidebarStore } from '../store/sidebarStore';
import { Colors, Gradients } from '../constants/Colors';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.78;

interface NavItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  path: any;
}

function NavRow({ item, onPress }: { item: NavItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconWrap, { backgroundColor: Colors.primaryBg }]}>
        <Ionicons name={item.icon} size={18} color={Colors.primary} />
      </View>
      <Text style={[styles.menuText, { color: Colors.text }]}>{item.label}</Text>
      <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function Sidebar() {
  const { user, token, logout } = useAuthStore();
  const { isOpen, closeSidebar } = useSidebarStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const C = Colors;

  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withSpring(0, { damping: 22, stiffness: 95 });
      opacity.value = withTiming(1, { duration: 230 });
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 240 });
      opacity.value = withTiming(0, { duration: 220 });
    }
  }, [isOpen]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: isOpen ? 'auto' : 'none',
  }));

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleNavigate = (path: any) => {
    closeSidebar();
    setTimeout(() => router.push(path), 200);
  };

  const handleLogout = () => {
    logout();
    closeSidebar();
    router.replace('/(auth)/login');
  };

  const isVendor = user?.role === 'vendor';
  const isLoggedIn = !!token;
  const displayName = user?.name_en || user?.email?.split('@')[0] || 'Guest';
  const initials = (displayName?.[0] ?? 'G').toUpperCase();

  const generalNav: NavItem[] = [
    { icon: 'home-outline', label: 'Home', path: '/(tabs)' },
    { icon: 'search-outline', label: 'Explore', path: '/(tabs)/explore' },
    { icon: 'person-outline', label: 'Profile', path: '/(tabs)/profile' },
  ];

  const vendorNav: NavItem[] = [
    { icon: 'grid-outline', label: 'Dashboard', path: '/vendor/dashboard' },
    { icon: 'storefront-outline', label: 'My Shops', path: '/vendor/shops' },
    { icon: 'construct-outline', label: 'Services', path: '/vendor/services' },
    { icon: 'calendar-outline', label: 'Appointments', path: '/vendor/appointments' },
    { icon: 'star-outline', label: 'Reviews', path: '/vendor/reviews' },
  ];

  const customerNav: NavItem[] = [
    { icon: 'calendar-outline', label: 'My Bookings', path: '/(tabs)/bookings' },
    { icon: 'heart-outline', label: 'Favourites', path: '/(tabs)/profile' },
    { icon: 'settings-outline', label: 'Settings', path: '/(tabs)/profile' },
  ];

  return (
    <>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity style={styles.overlayBg} activeOpacity={1} onPress={closeSidebar} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sidebar,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: C.background,
          },
          sidebarStyle,
        ]}
      >
        {/* Header — gradient for logged-in, plain for guest */}
        {isLoggedIn ? (
          <LinearGradient
            colors={Gradients.hero}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative circle */}
            <View style={styles.headerDecor} />
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
                <View style={styles.rolePill}>
                  <Ionicons
                    name={isVendor ? 'business' : 'person'}
                    size={10}
                    color="rgba(255,255,255,0.85)"
                  />
                  <Text style={styles.roleText}>
                    {isVendor ? 'Vendor' : 'Customer'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.headerPlain, { backgroundColor: C.card, borderBottomColor: C.border }]}>
            <View style={styles.avatarRow}>
              <View style={[styles.avatarCirclePlain, { backgroundColor: C.divider }]}>
                <Ionicons name="person-outline" size={22} color={C.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerNamePlain, { color: C.text }]}>Welcome</Text>
                <TouchableOpacity onPress={() => handleNavigate('/(auth)/login')}>
                  <Text style={[styles.loginLink, { color: C.primary }]}>Sign in or Register</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={closeSidebar} style={[styles.closeBtnPlain, { backgroundColor: C.divider }]}>
                <Ionicons name="close" size={16} color={C.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Menu content */}
        <View style={styles.menuList}>
          {/* General */}
          <Text style={[styles.sectionLabel, { color: C.textMuted }]}>NAVIGATION</Text>
          {generalNav.map((item) => (
            <NavRow key={item.label} item={item} onPress={() => handleNavigate(item.path)} />
          ))}

          {/* Vendor section */}
          {isVendor && isLoggedIn && (
            <>
              <View style={[styles.sectionDivider, { backgroundColor: C.divider }]} />
              <Text style={[styles.sectionLabel, { color: C.textMuted }]}>VENDOR</Text>
              {vendorNav.map((item) => (
                <NavRow key={item.label} item={item} onPress={() => handleNavigate(item.path)} />
              ))}
            </>
          )}

          {/* Customer section */}
          {!isVendor && isLoggedIn && (
            <>
              <View style={[styles.sectionDivider, { backgroundColor: C.divider }]} />
              <Text style={[styles.sectionLabel, { color: C.textMuted }]}>ACCOUNT</Text>
              {customerNav.map((item) => (
                <NavRow key={item.label} item={item} onPress={() => handleNavigate(item.path)} />
              ))}
            </>
          )}
        </View>

        {/* Footer */}
        {isLoggedIn && (
          <TouchableOpacity
            style={[styles.logoutBtn, { borderTopColor: C.border }]}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <View style={[styles.logoutIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={17} color={C.error} />
            </View>
            <Text style={[styles.logoutText, { color: C.error }]}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 6, height: 0 },
    shadowRadius: 20,
    elevation: 14,
  },

  // Gradient header (logged in)
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -40,
    right: -40,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  headerName: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Plain header (guest)
  headerPlain: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  avatarCirclePlain: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNamePlain: { fontSize: 15, fontWeight: '700' },
  loginLink: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  closeBtnPlain: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Menu
  menuList: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionDivider: { height: 1, marginVertical: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { fontSize: 15, fontWeight: '600', flex: 1 },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    gap: 12,
  },
  logoutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '600' },
});

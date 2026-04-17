import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { Colors, Gradients } from '../../constants/Colors';
import { THEME } from '@/components/Reuse.tsx/Reusecolor';

const { width: W, height: H } = Dimensions.get('window');

// ── Floating service-icon bubble ──────────────────────────────────────────────
function ServiceBubble({
  icon, top, left, right, size = 42, opacity = 0.18, color = '#FFF',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  top?: number; left?: number; right?: number;
  size?: number; opacity?: number; color?: string;
}) {
  return (
    <View style={[
      bubble.wrap,
      { top, left, right, width: size, height: size, borderRadius: size / 2, opacity },
    ]}>
      <Ionicons name={icon} size={size * 0.48} color={color} />
    </View>
  );
}
const bubble = StyleSheet.create({
  wrap: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});

// ── Category pill  ─────────────────────────────────────────────────────────────
function CategoryPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={pill.wrap}>
      <Ionicons name={icon} size={13} color="#FFF" />
      <Text style={pill.text}>{label}</Text>
    </View>
  );
}
const pill = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  text: { color: '#FFF', fontSize: 11, fontWeight: '600' },
});

// ══════════════════════════════════════════════════════════════════════════════
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVendorMode, setIsVendorMode] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const { login, isLoading } = useAuthStore();
  const C = Colors;

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) { Alert.alert('Missing Info', 'Please enter your email address.'); return; }
    if (!password) { Alert.alert('Missing Info', 'Please enter your password.'); return; }
    try {
      await login(trimmedEmail, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || err?.message || 'Invalid credentials. Please try again.';
      Alert.alert('Login Failed', msg);
    }
  };

  //const PINK = '#E91E63';
  const PINK = '#9660BF';

  //const PINK_LIGHT = '#FCE4EC';
  const PINK_LIGHT = '#F3E5F5';

  // Hero gradient (updated to pink → purple flow)
  const heroColors: [string, string] = isVendorMode
    ? ['#FF4081', '#7C4DFF']   // deep purple → pink (vendor mode)
    : ['#7C4DFF', '#FF4081']; // pink → purple (main theme)

  return (
    <View style={{ flex: 1, backgroundColor: '#E91E63' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ══ HERO SECTION ════════════════════════════════════════════════ */}
          <LinearGradient
            colors={heroColors}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.hero}
          >
            {/* Floating decorative blobs */}
            <View style={styles.blob1} />
            <View style={styles.blob2} />
            <View style={styles.blob3} />

            {/* Floating service icons — Urban Company style */}
            <ServiceBubble icon="cut-outline" top={90} left={22} size={46} opacity={0.22} />
            <ServiceBubble icon="car-outline" top={65} right={30} size={40} opacity={0.18} />
            <ServiceBubble icon="home-outline" top={145} right={60} size={50} opacity={0.14} />
            <ServiceBubble icon="restaurant-outline" top={175} left={55} size={36} opacity={0.16} />
            <ServiceBubble icon="fitness-outline" top={110} left={120} size={34} opacity={0.12} />
            <ServiceBubble icon="sparkles-outline" top={50} left={160} size={38} opacity={0.15} />

            <SafeAreaView edges={['top']}>
              <View style={styles.heroContent}>
                {/* Logo mark */}
                <View style={styles.logoMark}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.08)']}
                    style={styles.logoGradient}
                  >
                    <Ionicons name="business" size={28} color="#FFF" />
                  </LinearGradient>
                </View>

                {/* App name */}
                <Text style={styles.appName}>Unite Oman</Text>
                <Text style={styles.appTagline}>
                  Your city's best services, at your fingertips
                </Text>

                {/* Service category pills — Justdial style */}
                <View style={styles.pillsRow}>
                  <CategoryPill icon="cut-outline" label="Salons" />
                  <CategoryPill icon="car-outline" label="Auto" />
                  <CategoryPill icon="restaurant-outline" label="Dining" />
                  <CategoryPill icon="home-outline" label="Home" />
                </View>

                {/* Trust strip */}
                <View style={styles.trustStrip}>
                  <View style={styles.trustItem}>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                    <Text style={styles.trustText}>4.8 Rated</Text>
                  </View>
                  <View style={styles.trustDivider} />
                  <View style={styles.trustItem}>
                    <Ionicons name="shield-checkmark" size={12} color="#34D399" />
                    <Text style={styles.trustText}>Verified</Text>
                  </View>
                  <View style={styles.trustDivider} />
                  <View style={styles.trustItem}>
                    <Ionicons name="business" size={12} color="#A5B4FC" />
                    <Text style={styles.trustText}>1000+ Shops</Text>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* ══ FORM SHEET ══════════════════════════════════════════════════ */}
          <View style={[styles.sheet, { backgroundColor: C.card }]}>
            {/* Sheet handle */}
            <View style={styles.sheetHandle} />

            {/* Mode toggle row */}
            <View style={[styles.modeRow, { backgroundColor: PINK_LIGHT }]}>
              <TouchableOpacity
                style={[
                  styles.modeTab,
                  {
                    backgroundColor: !isVendorMode ? '#FFF' : 'transparent',
                    borderWidth: !isVendorMode ? 1 : 0,
                    borderColor: PINK,
                  },
                ]}
                onPress={() => setIsVendorMode(false)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={!isVendorMode ? PINK : '#888'}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    { color: !isVendorMode ? PINK : '#888' },
                  ]}
                >
                  Customer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeTab,
                  {
                    backgroundColor: isVendorMode ? '#FFF' : 'transparent',
                    borderWidth: isVendorMode ? 1 : 0,
                    borderColor: PINK,
                  },
                ]}
                onPress={() => setIsVendorMode(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="business-outline"
                  size={14}
                  color={isVendorMode ? PINK : '#888'}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    { color: isVendorMode ? PINK : '#888' },
                  ]}
                >
                  Business
                </Text>
              </TouchableOpacity>
            </View>

            {/* Greeting */}
            <Text style={[styles.sheetTitle, { color: C.text }]}>
              {isVendorMode ? 'Vendor Portal 🏪' : 'Welcome back 👋'}
            </Text>
            <Text style={[styles.sheetSub, { color: C.textSecondary }]}>
              {isVendorMode
                ? 'Manage your shops, bookings & analytics'
                : 'Find and book the best services in Oman'}
            </Text>

            {/* Email field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Email Address</Text>
              <View style={[
                styles.fieldBox,
                {
                  borderColor: focusedField === 'email' ? THEME.darkcolor : '#E0E0E0',
                  backgroundColor: focusedField === 'email' ? '#FAFBFF' : C.divider,
                },
              ]}>
                <View style={[
                  styles.fieldIconBox,
                  { backgroundColor: focusedField === 'email' ? C.primaryBg : 'transparent' },
                ]}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={focusedField === 'email' ? THEME.darkcolor : '#E0E0E0'}
                  />
                </View>
                <TextInput
                  style={[styles.fieldInput, { color: C.text }]}
                  placeholder="you@example.com"
                  placeholderTextColor={C.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                {email.length > 0 && (
                  <TouchableOpacity onPress={() => setEmail('')} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={16} color={C.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Password field */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Password</Text>
                <TouchableOpacity>
                  <Text style={[styles.forgotText, { color: THEME.darkcolor }]}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={[
                styles.fieldBox,
                {
                  borderColor: focusedField === 'password' ? THEME.darkcolor : C.border,
                  backgroundColor: focusedField === 'password' ? '#FAFBFF' : C.divider,
                },
              ]}>
                <View style={[
                  styles.fieldIconBox,
                  { backgroundColor: focusedField === 'password' ? C.primaryBg : 'transparent' },
                ]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={focusedField === 'password' ? THEME.darkcolor : '#E0E0E0'}
                  />
                </View>
                <TextInput
                  ref={passwordRef}
                  style={[styles.fieldInput, { color: C.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={C.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  returnKeyType="done"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={C.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In CTA — Urban Company style bold button */}
            <TouchableOpacity
              style={[styles.signInBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={THEME.darkGradient}
                style={styles.signInGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.signInText}>
                      {isVendorMode ? 'Access Vendor Portal' : 'Sign In'}
                    </Text>
                    <View style={styles.signInArrow}>
                      <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divRow}>
              <View style={[styles.divLine, { backgroundColor: C.border }]} />
              <Text style={[styles.divText, { color: C.textMuted }]}>or</Text>
              <View style={[styles.divLine, { backgroundColor: C.border }]} />
            </View>

            {/* Create account  */}
            <TouchableOpacity
              style={[styles.createBtn, { borderColor: C.border }]}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.85}
            >
              <View style={[styles.createIcon, { backgroundColor: C.primaryBg }]}>
                <Ionicons name="person-add-outline" size={16} color={THEME.primary} />
              </View>
              <Text style={[styles.createText, { color: C.text }]}>Create an Account</Text>
            </TouchableOpacity>

            {/* Guest */}
            <TouchableOpacity style={styles.guestBtn} onPress={() => router.replace('/(tabs)')}>
              <Ionicons name="eye-outline" size={14} color={C.textMuted} />
              <Text style={[styles.guestText, { color: C.textMuted }]}>Continue as Guest</Text>
            </TouchableOpacity>

            {/* Legal */}
            <Text style={[styles.legal, { color: C.textMuted }]}>
              By signing in you agree to our{' '}
              <Text style={{ color: THEME.darkcolor, fontWeight: '600' }}>Terms</Text>
              {' & '}
              <Text style={{ color: THEME.darkcolor, fontWeight: '600' }}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingBottom: 72,
    overflow: 'hidden',
    minHeight: H * 0.42,
  },
  blob1: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -80, right: -80,
  },
  blob2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 10, left: -50,
  },
  blob3: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: H * 0.12, left: W * 0.42,
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: 44,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  logoMark: {
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  logoGradient: {
    width: 68, height: 68, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  appTagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 18,
  },
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  trustDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.25)' },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -32,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 11,
  },
  modeTabActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  modeTabText: {
    fontSize: 13, fontWeight: '700', color: Colors.textMuted,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 26,
    lineHeight: 19,
  },
  fieldGroup: { marginBottom: 14 },
  fieldLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  forgotText: { fontSize: 12, fontWeight: '700' },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    gap: 4,
  },
  fieldIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  fieldInput: {
    flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 9,
  },
  clearBtn: { padding: 6 },
  eyeBtn: { padding: 8 },
  signInBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  signInGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
    minHeight: 58,
  },
  signInText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  signInArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#010101',
    alignItems: 'center', justifyContent: 'center',
  },
  divRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 18, gap: 12,
  },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 12, fontWeight: '500' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5, borderRadius: 14,
    paddingVertical: 15,
    backgroundColor: '#F8FAFF',
  },
  createIcon: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  createText: { fontSize: 15, fontWeight: '700' },
  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 14, paddingVertical: 8,
  },
  guestText: { fontSize: 13, fontWeight: '500' },
  legal: {
    fontSize: 11, textAlign: 'center', marginTop: 18, lineHeight: 16,
  },
});

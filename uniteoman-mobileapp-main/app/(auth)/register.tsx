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
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { catalogApi, commonApi } from '../../lib/apiClient';
import { Colors, Gradients } from '../../constants/Colors';

const C = Colors;

// ── Reusable input field ───────────────────────────────────────────────────────
function Field({
  icon, label, value, onChange, placeholder,
  secure, keyboardType, returnKeyType, onSubmit,
  inputRef, rightChild, required,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: any;
  returnKeyType?: any;
  onSubmit?: () => void;
  inputRef?: React.RefObject<TextInput>;
  rightChild?: React.ReactNode;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fs.wrap}>
      <Text style={[fs.label, { color: C.textSecondary }]}>
        {label}{required && <Text style={{ color: C.error }}> *</Text>}
      </Text>
      <View style={[
        fs.box,
        {
          borderColor: focused ? C.primary : C.border,
          backgroundColor: focused ? '#FAFBFF' : C.divider,
        },
      ]}>
        <View style={[fs.iconWrap, { backgroundColor: focused ? C.primaryBg : 'transparent' }]}>
          <Ionicons name={icon} size={17} color={focused ? C.primary : C.textMuted} />
        </View>
        <TextInput
          ref={inputRef}
          style={[fs.input, { color: C.text }]}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize="none"
          secureTextEntry={secure}
          returnKeyType={returnKeyType ?? 'next'}
          onSubmitEditing={onSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightChild}
      </View>
    </View>
  );
}
const fs = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 7, letterSpacing: 0.4, textTransform: 'uppercase' },
  box: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 4, paddingVertical: Platform.OS === 'ios' ? 2 : 0,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 10 },
});

// ── Select / picker row ───────────────────────────────────────────────────────
function SelectField({
  icon, label, value, placeholder, onPress, required,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  required?: boolean;
}) {
  return (
    <View style={fs.wrap}>
      <Text style={[fs.label, { color: C.textSecondary }]}>
        {label}{required && <Text style={{ color: C.error }}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[fs.box, { borderColor: C.border, backgroundColor: C.divider }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[fs.iconWrap, { backgroundColor: 'transparent' }]}>
          <Ionicons name={icon} size={17} color={value ? C.primary : C.textMuted} />
        </View>
        <Text style={[
          { flex: 1, fontSize: 14, fontWeight: value ? '500' : '400', paddingVertical: 10 },
          { color: value ? C.text : C.textMuted },
        ]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={C.textMuted} style={{ marginRight: 10 }} />
      </TouchableOpacity>
    </View>
  );
}

// ── Document upload tile ──────────────────────────────────────────────────────
function DocTile({
  icon, label, subtitle, uri, onPress, uploading, required,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  uri?: string;
  onPress: () => void;
  uploading?: boolean;
  required?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        docTile.wrap,
        uri
          ? { borderColor: C.success, backgroundColor: '#F0FDF4' }
          : { borderColor: C.border, backgroundColor: C.divider },
      ]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {uri ? (
        <Image source={{ uri }} style={docTile.thumb} />
      ) : (
        <View style={[docTile.iconBox, { backgroundColor: uri ? '#DCFCE7' : C.primaryBg }]}>
          {uploading ? (
            <ActivityIndicator color={C.primary} size="small" />
          ) : (
            <Ionicons name={icon} size={22} color={uri ? C.success : C.primary} />
          )}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[docTile.title, { color: C.text }]}>
          {label}
          {required && <Text style={{ color: C.error }}> *</Text>}
        </Text>
        <Text style={[docTile.sub, { color: uri ? C.success : C.textMuted }]}>
          {uri ? '✓ Uploaded successfully' : subtitle}
        </Text>
      </View>
      <View style={[
        docTile.badge,
        { backgroundColor: uri ? '#DCFCE7' : C.primaryBg },
      ]}>
        <Ionicons
          name={uri ? 'checkmark' : 'cloud-upload-outline'}
          size={16}
          color={uri ? C.success : C.primary}
        />
      </View>
    </TouchableOpacity>
  );
}
const docTile = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 12,
  },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  sub: { fontSize: 11, fontWeight: '500' },
  badge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

// ── Picker modal (for categories / governorates) ──────────────────────────────
function PickerModal({
  visible, title, items, onSelect, onClose,
}: {
  visible: boolean;
  title: string;
  items: { id: number; label: string }[];
  onSelect: (item: { id: number; label: string }) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[pm.sheet, { backgroundColor: C.card }]}>
        <View style={pm.handle} />
        <Text style={[pm.title, { color: C.text }]}>{title}</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={pm.row} onPress={() => { onSelect(item); onClose(); }}>
              <Text style={[pm.rowText, { color: C.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={[pm.sep, { backgroundColor: C.border }]} />}
        />
      </View>
    </Modal>
  );
}
const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingBottom: 40, maxHeight: '70%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  rowText: { fontSize: 15, fontWeight: '500' },
  sep: { height: 1 },
});

// ══════════════════════════════════════════════════════════════════════════════
const STEPS = [
  { id: 1, label: 'Account',  icon: 'person-outline' as const },
  { id: 2, label: 'Business', icon: 'business-outline' as const },
  { id: 3, label: 'Docs',     icon: 'document-text-outline' as const },
];

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [done, setDone]   = useState(false);    // success state

  // Step 1 — account
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPw, setConfirmPw]       = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // Step 2 — business
  const [bizName, setBizName]           = useState('');
  const [phone, setPhone]               = useState('');
  const [address, setAddress]           = useState('');
  const [catId, setCatId]               = useState<number | null>(null);
  const [catLabel, setCatLabel]         = useState('');
  const [govId, setGovId]               = useState<number | null>(null);
  const [govLabel, setGovLabel]         = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showGovPicker, setShowGovPicker] = useState(false);

  // Step 3 — documents
  const [idProofUri, setIdProofUri]         = useState('');
  const [ownerPhotoUri, setOwnerPhotoUri]   = useState('');
  const [tradeUri, setTradeUri]             = useState('');
  const [uploadingId, setUploadingId]       = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingTrade, setUploadingTrade] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const { vendorRegister } = useAuthStore();

  // Catalog data
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => catalogApi.categories() });
  const { data: governorates } = useQuery({ queryKey: ['governorates'], queryFn: () => catalogApi.governorates() });

  const catItems = (categories ?? []).map(c => ({ id: c.id, label: c.name_en }));
  const govItems = (governorates ?? []).map(g => ({ id: g.id, label: g.name_en }));

  // ── Image picker + upload ──────────────────────────────────────────────────
  const pickAndUpload = async (
    setUri: (u: string) => void,
    setLoading: (b: boolean) => void,
  ) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setLoading(true);
    try {
      const res = await commonApi.upload(asset.uri, asset.fileName ?? 'upload.jpg', asset.mimeType ?? 'image/jpeg');
      setUri(res.url);
    } catch {
      Alert.alert('Upload Failed', 'Could not upload file. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Step validation ────────────────────────────────────────────────────────
  const validateStep1 = (): string | null => {
    if (!fullName.trim()) return 'Full name is required.';
    if (fullName.trim().length < 2) return 'Name must be at least 2 characters.';
    if (!email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPw) return 'Passwords do not match.';
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!bizName.trim()) return 'Business name is required.';
    if (!catId) return 'Please select a category.';
    if (!govId) return 'Please select a location.';
    return null;
  };

  const validateStep3 = (): string | null => {
    if (!idProofUri) return 'ID Proof is mandatory. Please upload it.';
    if (!ownerPhotoUri) return 'Owner photo is mandatory. Please upload it.';
    return null;
  };

  const goNext = () => {
    let err: string | null = null;
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();
    if (err) { Alert.alert('Required', err); return; }
    setStep(s => s + 1);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validateStep3();
    if (err) { Alert.alert('Required', err); return; }
    setSubmitting(true);
    try {
      await vendorRegister({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        business_name: bizName.trim(),
        category_id: catId!,
        location_id: govId!,
        id_proof_url: idProofUri,
        owner_photo_url: ownerPhotoUri,
        trade_license_url: tradeUri || null,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      setDone(true);
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally { setSubmitting(false); }
  };

  // ── Step-by-step progress bar ──────────────────────────────────────────────
  const StepBar = () => (
    <View style={styles.stepBar}>
      {STEPS.map((s, i) => {
        const done_  = step > s.id;
        const active = step === s.id;
        return (
          <React.Fragment key={s.id}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                done_  && { backgroundColor: C.success },
                active && { backgroundColor: C.primary },
                !done_ && !active && { backgroundColor: C.divider },
              ]}>
                {done_ ? (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                ) : (
                  <Ionicons name={s.icon} size={14} color={active ? '#FFF' : C.textMuted} />
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                { color: active ? C.primary : done_ ? C.success : C.textMuted },
              ]}>
                {s.label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[
                styles.stepLine,
                { backgroundColor: step > s.id ? C.success : C.border },
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );

  // ── Success screen ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#3730A3', '#4338CA', '#6366F1']} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 30 }}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={56} color="#FFF" />
              </View>
              <Text style={styles.successTitle}>Registration Submitted!</Text>
              <Text style={styles.successSub}>
                Your business is under review.{'\n'}Admin will approve within 24–48 hours.
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={[styles.sheet, { backgroundColor: C.card, paddingTop: 36 }]}>
          {[
            { icon: 'mail-outline', title: 'Check your email', body: `We'll send confirmation to ${email}` },
            { icon: 'time-outline', title: 'Review in progress', body: 'Admin verifies your documents and business info' },
            { icon: 'business-outline', title: 'Go live!', body: 'Once approved, your listing appears on the directory' },
          ].map((step_, i) => (
            <View key={i} style={[styles.nextStep, { backgroundColor: C.divider }]}>
              <View style={[styles.nextStepIcon, { backgroundColor: C.primaryBg }]}>
                <Ionicons name={step_.icon as any} size={18} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nextStepTitle, { color: C.text }]}>{step_.title}</Text>
                <Text style={[styles.nextStepBody, { color: C.textSecondary }]}>{step_.body}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.cta} onPress={() => router.replace('/(auth)/login')}>
            <LinearGradient colors={Gradients.primary} style={styles.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.ctaText}>Back to Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle="light-content" backgroundColor="#3730A3" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Hero ──────────────────────────────────────────────────── */}
          <LinearGradient
            colors={['#3730A3', '#4338CA', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* Decorative blobs */}
            <View style={[styles.blob, { top: -40, right: -40, width: 150, height: 150, opacity: 0.1 }]} />
            <View style={[styles.blob, { bottom: 15, left: -40, width: 120, height: 120, opacity: 0.08 }]} />

            <SafeAreaView edges={['top']}>
              <View style={styles.heroContent}>
                {/* Back button */}
                <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(s => s - 1) : router.back()}>
                  <Ionicons name="arrow-back" size={19} color="#FFF" />
                </TouchableOpacity>

                {/* Icon */}
                <View style={styles.heroIcon}>
                  <Ionicons name="business" size={28} color="#FFF" />
                </View>

                <Text style={styles.heroTitle}>List Your Business</Text>
                <Text style={styles.heroSub}>
                  Join Oman's premier digital directory
                </Text>

                {/* Step bar */}
                <StepBar />
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* ── Form Sheet ───────────────────────────────────────────── */}
          <View style={[styles.sheet, { backgroundColor: C.card }]}>
            <View style={styles.sheetHandle} />

            {/* ─ Step 1: Account ─────────────────────────────────────── */}
            {step === 1 && (
              <>
                <Text style={[styles.stepTitle, { color: C.text }]}>Account Details</Text>
                <Text style={[styles.stepSub, { color: C.textSecondary }]}>
                  Your login credentials for the vendor portal
                </Text>

                <Field
                  icon="person-outline" label="Full Name" value={fullName}
                  onChange={setFullName} placeholder="e.g. Ahmed Al Rashdi" required
                />
                <Field
                  icon="mail-outline" label="Email Address" value={email}
                  onChange={setEmail} placeholder="shop@example.com"
                  keyboardType="email-address" required
                />
                <Field
                  icon="lock-closed-outline" label="Password" value={password}
                  onChange={setPassword} placeholder="Minimum 6 characters" secure={!showPw}
                  required
                  rightChild={
                    <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ paddingHorizontal: 12 }}>
                      <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                    </TouchableOpacity>
                  }
                />
                <Field
                  icon="shield-checkmark-outline" label="Confirm Password" value={confirmPw}
                  onChange={setConfirmPw} placeholder="Re-enter password" secure={!showConfirm}
                  required
                  rightChild={
                    <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={{ paddingHorizontal: 12 }}>
                      <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                    </TouchableOpacity>
                  }
                />

                {/* Password mismatch hint */}
                {confirmPw.length > 0 && confirmPw !== password && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color={C.error} />
                    <Text style={[styles.errorText, { color: C.error }]}>Passwords do not match</Text>
                  </View>
                )}
              </>
            )}

            {/* ─ Step 2: Business ────────────────────────────────────── */}
            {step === 2 && (
              <>
                <Text style={[styles.stepTitle, { color: C.text }]}>Business Information</Text>
                <Text style={[styles.stepSub, { color: C.textSecondary }]}>
                  Tell us about your business
                </Text>

                <Field
                  icon="business-outline" label="Business Name" value={bizName}
                  onChange={setBizName} placeholder="e.g. Muscat Coffee House" required
                />
                <Field
                  icon="call-outline" label="Phone Number" value={phone}
                  onChange={setPhone} placeholder="+968 XXXX XXXX" keyboardType="phone-pad"
                />
                <Field
                  icon="location-outline" label="Address" value={address}
                  onChange={setAddress} placeholder="Street / area address"
                />

                <SelectField
                  icon="grid-outline" label="Category" value={catLabel}
                  placeholder="Select a category"
                  onPress={() => setShowCatPicker(true)}
                  required
                />
                <SelectField
                  icon="map-outline" label="Location (Governorate)" value={govLabel}
                  placeholder="Select a governorate"
                  onPress={() => setShowGovPicker(true)}
                  required
                />

                {/* Pickers */}
                <PickerModal
                  visible={showCatPicker} title="Select Category"
                  items={catItems}
                  onSelect={item => { setCatId(item.id); setCatLabel(item.label); }}
                  onClose={() => setShowCatPicker(false)}
                />
                <PickerModal
                  visible={showGovPicker} title="Select Governorate"
                  items={govItems}
                  onSelect={item => { setGovId(item.id); setGovLabel(item.label); }}
                  onClose={() => setShowGovPicker(false)}
                />
              </>
            )}

            {/* ─ Step 3: Documents ───────────────────────────────────── */}
            {step === 3 && (
              <>
                <Text style={[styles.stepTitle, { color: C.text }]}>Verification Documents</Text>
                <Text style={[styles.stepSub, { color: C.textSecondary }]}>
                  Required for admin approval. Keeps the directory trustworthy.
                </Text>

                <DocTile
                  icon="card-outline" label="ID Proof" required
                  subtitle="National ID or passport (image)"
                  uri={idProofUri} uploading={uploadingId}
                  onPress={() => pickAndUpload(setIdProofUri, setUploadingId)}
                />
                <DocTile
                  icon="person-circle-outline" label="Owner Photo" required
                  subtitle="Clear photo of the business owner"
                  uri={ownerPhotoUri} uploading={uploadingPhoto}
                  onPress={() => pickAndUpload(setOwnerPhotoUri, setUploadingPhoto)}
                />
                <DocTile
                  icon="document-outline" label="Trade License"
                  subtitle="Optional — commercial registration document"
                  uri={tradeUri} uploading={uploadingTrade}
                  onPress={() => pickAndUpload(setTradeUri, setUploadingTrade)}
                />

                {/* Info note */}
                <View style={[styles.infoBox, { backgroundColor: C.primaryBg, borderColor: C.primaryBgDeep }]}>
                  <Ionicons name="shield-checkmark" size={16} color={C.primary} />
                  <Text style={[styles.infoText, { color: C.textSecondary }]}>
                    Documents are reviewed by admins only. Your business will go live within 24–48 hours after approval.
                  </Text>
                </View>
              </>
            )}

            {/* ── Navigation Buttons ─────────────────────────────────── */}
            <View style={styles.navRow}>
              {/* Back button — shown on steps 2 & 3 */}
              {step > 1 && (
                <TouchableOpacity
                  style={[styles.backStepBtn, { borderColor: C.border, backgroundColor: C.divider }]}
                  onPress={() => setStep(s => s - 1)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={18} color={C.text} />
                  <Text style={[styles.backStepText, { color: C.text }]}>Back</Text>
                </TouchableOpacity>
              )}

              {/* Continue / Submit */}
              <TouchableOpacity
                style={[
                  styles.cta,
                  { flex: 1, marginTop: 0 },
                  submitting && { opacity: 0.7 },
                ]}
                onPress={step < 3 ? goNext : handleSubmit}
                disabled={submitting}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={Gradients.primary}
                  style={styles.ctaGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.ctaText}>
                        {step < 3 ? `Continue` : 'Submit →'}
                      </Text>
                      {step < 3 && (
                        <View style={styles.ctaArrow}>
                          <Ionicons name="arrow-forward" size={15} color={C.primary} />
                        </View>
                      )}
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Sign in link */}
            <TouchableOpacity style={styles.signInLink} onPress={() => router.back()}>
              <Text style={[styles.signInText, { color: C.textSecondary }]}>
                Already registered?{'  '}
                <Text style={{ color: C.primary, fontWeight: '800' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  hero: { paddingBottom: 52, overflow: 'hidden', minHeight: 260 },
  blob: { position: 'absolute', backgroundColor: '#FFF', borderRadius: 999 },
  heroContent: { alignItems: 'center', paddingTop: 14, paddingHorizontal: 24, paddingBottom: 8 },
  backBtn: {
    alignSelf: 'flex-start', width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  heroIcon: {
    width: 70, height: 70, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  heroSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 6,
    textAlign: 'center', marginBottom: 20,
  },

  // Step bar
  stepBar: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  stepItem: { alignItems: 'center', gap: 5 },
  stepCircle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 6, marginBottom: 18, minWidth: 30 },

  // Sheet
  sheet: {
    flex: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    marginTop: -28, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 48,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB',
    alignSelf: 'center', marginBottom: 20,
  },

  // Step headings
  stepTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  stepSub: { fontSize: 13, lineHeight: 19, marginBottom: 22 },

  // Errors
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -6, marginBottom: 12 },
  errorText: { fontSize: 12, fontWeight: '600' },

  // Info note
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },

  // CTA button
  cta: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  ctaGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, gap: 10, minHeight: 56,
  },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  ctaArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
  },

  // Sign in link
  signInLink: { alignItems: 'center', marginTop: 22, paddingVertical: 8 },
  signInText: { fontSize: 14, fontWeight: '500' },

  // Navigation row (back + continue)
  navRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8,
  },
  backStepBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 16, paddingHorizontal: 18,
    borderRadius: 14, borderWidth: 1.5,
    minWidth: 100,
  },
  backStepText: { fontSize: 15, fontWeight: '700' },

  // Success screen
  successIcon: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 10 },
  successSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 22,
  },
  nextStep: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: 14, marginBottom: 10,
  },
  nextStepIcon: {
    width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  nextStepTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  nextStepBody: { fontSize: 12, lineHeight: 17 },
});

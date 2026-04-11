import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, Modal, FlatList, StatusBar
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { businessApi, catalogApi, commonApi } from '../../../lib/apiClient';
import { Colors, Gradients } from '../../../constants/Colors';
import { API_BASE_URL } from '../../../constants/api';

const DEFAULT_HOURS = {
  monday:    { open: '09:00', close: '18:00', closed: false },
  tuesday:   { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday:  { open: '09:00', close: '18:00', closed: false },
  friday:    { open: '09:00', close: '18:00', closed: true  },
  saturday:  { open: '09:00', close: '18:00', closed: false },
  sunday:    { open: '09:00', close: '18:00', closed: false },
};

function buildUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('file')) return url;
  const path = url.startsWith('/') ? url.slice(1) : url;
  return `${API_BASE_URL}/${path}`;
}

// ── Picker Modal ────────────────────────────────────────────────────────────
function PickerModal({
  visible, title, items, selectedId, onSelect, onClose
}: {
  visible: boolean;
  title: string;
  items: { id: string | number; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const C = Colors;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={pickerStyles.overlay}>
        <View style={[pickerStyles.sheet, { backgroundColor: C.card }]}>
          <View style={pickerStyles.handle} />
          <Text style={[pickerStyles.title, { color: C.text }]}>{title}</Text>
          <FlatList
            data={items}
            keyExtractor={i => String(i.id)}
            renderItem={({ item }) => {
              const isSelected = String(item.id) === selectedId;
              return (
                <TouchableOpacity
                  style={[pickerStyles.item, isSelected && { backgroundColor: C.primaryBg }]}
                  onPress={() => { onSelect(String(item.id)); onClose(); }}
                >
                  <Text style={[pickerStyles.itemText, { color: isSelected ? C.primary : C.text }]}>
                    {item.name}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity style={[pickerStyles.closeBtn, { backgroundColor: C.border }]} onPress={onClose}>
            <Text style={{ color: C.text, fontWeight: '700' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  itemText: { fontSize: 15, fontWeight: '600' },
  closeBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 12 },
});

// ── Field component ──────────────────────────────────────────────────────────
function Field({ label, icon, children }: { label: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  const C = Colors;
  return (
    <View style={fStyles.group}>
      <Text style={[fStyles.label, { color: C.textMuted }]}>{label}</Text>
      <View style={[fStyles.inputRow, { borderColor: C.border }]}>
        <Ionicons name={icon} size={16} color={C.textMuted} style={{ marginLeft: 12 }} />
        {children}
      </View>
    </View>
  );
}

const fStyles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, gap: 8,
  },
});

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; children: React.ReactNode }) {
  const C = Colors;
  return (
    <View style={[sStyles.card, { backgroundColor: C.card }]}>
      <View style={sStyles.header}>
        <View style={[sStyles.iconWrap, { backgroundColor: C.primaryBg }]}>
          <Ionicons name={icon} size={18} color={C.primary} />
        </View>
        <Text style={[sStyles.title, { color: C.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const sStyles = StyleSheet.create({
  card: { borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800' },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function EditShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const C = Colors;

  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [govPickerOpen, setGovPickerOpen] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ['vendor-shops'],
    queryFn: () => businessApi.me(),
  });

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => catalogApi.categories() });
  const { data: governorates } = useQuery({ queryKey: ['governorates'], queryFn: () => catalogApi.governorates() });

  const currentShop = shops?.find(s => s.id === id);

  const [form, setForm] = useState({
    name_en: '', name_ar: '', description: '', short_description: '',
    category_id: '', governorate_id: '',
    phone: '', whatsapp: '', email: '', website: '', address: '',
    logo_url: '', cover_image_url: '', gallery_urls: [] as string[],
    business_hours: DEFAULT_HOURS as Record<string, { open: string; close: string; closed: boolean }>,
  });

  useEffect(() => {
    if (currentShop) {
      const shop = currentShop as any;
      const rawHours = shop.business_hours;
      const safeHours: Record<string, { open: string; close: string; closed: boolean }> = {};
      Object.keys(DEFAULT_HOURS).forEach(day => {
        const h = rawHours?.[day];
        if (!h) { safeHours[day] = { ...(DEFAULT_HOURS as any)[day] }; return; }
        if (typeof h === 'string') {
          safeHours[day] = { open: '09:00', close: '18:00', closed: h === 'closed' };
        } else {
          safeHours[day] = { open: h.open || '09:00', close: h.close || '18:00', closed: !!h.closed };
        }
      });
      setForm({
        name_en: shop.name_en || '', name_ar: shop.name_ar || '',
        description: shop.description || '', short_description: shop.short_description || '',
        category_id: String(shop.category?.id || ''), governorate_id: String(shop.governorate?.id || ''),
        phone: shop.phone || '', whatsapp: shop.whatsapp || '',
        email: shop.email || '', website: shop.website || '', address: shop.address || '',
        logo_url: shop.logo_url || '', cover_image_url: shop.cover_image_url || '',
        gallery_urls: shop.gallery_urls || [],
        business_hours: safeHours,
      });
    }
  }, [currentShop]);

  const updateMu = useMutation({
    mutationFn: (payload: any) => businessApi.update(id!, payload),
    onSuccess: () => {
      Alert.alert('✅ Saved!', 'Shop updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['vendor-shops'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
      if (currentShop?.slug) queryClient.invalidateQueries({ queryKey: ['business', currentShop.slug] });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.detail || 'Failed to update shop'),
  });

  const pickAndUpload = async (type: 'logo' | 'cover' | 'gallery') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Please allow photo library access.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: type !== 'gallery',
      aspect: type === 'cover' ? [16, 9] : [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setUploadingType(type);
      try {
        const res = await commonApi.upload(result.assets[0].uri, `upload_${Date.now()}.jpg`, 'image/jpeg');
        if (type === 'logo') setForm(p => ({ ...p, logo_url: res.url }));
        else if (type === 'cover') setForm(p => ({ ...p, cover_image_url: res.url }));
        else setForm(p => ({ ...p, gallery_urls: [...p.gallery_urls, res.url] }));
      } catch { Alert.alert('Upload Failed', 'Try again.'); }
      finally { setUploadingType(null); }
    }
  };

  const handleSave = () => {
    if (!form.name_en.trim()) return Alert.alert('Required', 'Shop name is required.');
    const payload: any = { ...form };
    if (form.category_id) payload.category_id = parseInt(form.category_id);
    else delete payload.category_id;
    if (form.governorate_id) payload.governorate_id = parseInt(form.governorate_id);
    else delete payload.governorate_id;
    if (!payload.email) delete payload.email;
    if (!payload.phone) delete payload.phone;
    if (!payload.whatsapp) delete payload.whatsapp;
    if (!payload.website) delete payload.website;
    updateMu.mutate(payload);
  };

  const inp = (field: string) => ({
    style: [styles.textInput, { color: C.text }] as any,
    placeholderTextColor: C.textMuted,
    value: (form as any)[field],
    onChangeText: (t: string) => setForm(p => ({ ...p, [field]: t })),
  });

  if (shopsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={Gradients.primary} style={styles.pageHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Manage Shop</Text>
          <Text style={styles.pageSub}>{currentShop?.name_en || 'Update details & photos'}</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={updateMu.isPending}>
          {updateMu.isPending
            ? <ActivityIndicator size="small" color="#FFF" />
            : <><Ionicons name="save-outline" size={16} color="#FFF" /><Text style={styles.saveBtnText}>Save</Text></>}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

        {/* ── Basic Info ── */}
        <Section icon="business-outline" title="Basic Information">
          <Field label="Shop Name (English)" icon="text-outline">
            <TextInput {...inp('name_en')} placeholder="e.g. Al Noor Salon" style={[styles.textInput, { color: C.text, flex: 1 }]} />
          </Field>
          <Field label="Short Description" icon="document-text-outline">
            <TextInput {...inp('short_description')} placeholder="One-line summary" style={[styles.textInput, { color: C.text, flex: 1 }]} />
          </Field>
          <Field label="About / Full Description" icon="information-circle-outline">
            <TextInput
              value={form.description}
              onChangeText={t => setForm(p => ({ ...p, description: t }))}
              placeholder="Tell customers about your business..."
              placeholderTextColor={C.textMuted}
              style={[styles.textInput, styles.textArea, { color: C.text, flex: 1 }]}
              multiline
              numberOfLines={4}
            />
          </Field>

          {/* Category Picker */}
          <View style={fStyles.group}>
            <Text style={[fStyles.label, { color: C.textMuted }]}>Category</Text>
            <TouchableOpacity style={[styles.pickerBtn, { borderColor: C.border }]} onPress={() => setCatPickerOpen(true)}>
              <Ionicons name="pricetag-outline" size={16} color={C.textMuted} />
              <Text style={[styles.pickerText, { color: form.category_id ? C.text : C.textMuted }]}>
                {categories?.find(c => String(c.id) === form.category_id)?.name_en || 'Select category...'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Governorate Picker */}
          <View style={fStyles.group}>
            <Text style={[fStyles.label, { color: C.textMuted }]}>Governorate</Text>
            <TouchableOpacity style={[styles.pickerBtn, { borderColor: C.border }]} onPress={() => setGovPickerOpen(true)}>
              <Ionicons name="location-outline" size={16} color={C.textMuted} />
              <Text style={[styles.pickerText, { color: form.governorate_id ? C.text : C.textMuted }]}>
                {governorates?.find(g => String(g.id) === form.governorate_id)?.name_en || 'Select governorate...'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <Field label="Address" icon="map-outline">
            <TextInput {...inp('address')} placeholder="Street address, area" style={[styles.textInput, { color: C.text, flex: 1 }]} />
          </Field>
        </Section>

        {/* ── Media ── */}
        <Section icon="images-outline" title="Shop Photos">
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            {/* Logo */}
            <View style={{ flex: 1 }}>
              <Text style={[fStyles.label, { color: C.textMuted }]}>Logo</Text>
              <TouchableOpacity style={[styles.mediaBox, { borderColor: C.border }]} onPress={() => pickAndUpload('logo')}>
                {form.logo_url
                  ? <Image source={{ uri: buildUrl(form.logo_url) }} style={styles.mediaImg} />
                  : <View style={{ alignItems: 'center', gap: 6 }}>
                      {uploadingType === 'logo' ? <ActivityIndicator color={C.primary} /> : <Ionicons name="cloud-upload-outline" size={24} color={C.textMuted} />}
                      <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700' }}>TAP TO UPLOAD</Text>
                    </View>}
              </TouchableOpacity>
            </View>
            {/* Cover */}
            <View style={{ flex: 2 }}>
              <Text style={[fStyles.label, { color: C.textMuted }]}>Cover Image</Text>
              <TouchableOpacity style={[styles.mediaBox, { borderColor: C.border }]} onPress={() => pickAndUpload('cover')}>
                {form.cover_image_url
                  ? <Image source={{ uri: buildUrl(form.cover_image_url) }} style={styles.mediaImg} />
                  : <View style={{ alignItems: 'center', gap: 6 }}>
                      {uploadingType === 'cover' ? <ActivityIndicator color={C.primary} /> : <Ionicons name="cloud-upload-outline" size={24} color={C.textMuted} />}
                      <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700' }}>COVER PHOTO</Text>
                    </View>}
              </TouchableOpacity>
            </View>
          </View>

          {/* Gallery */}
          <Text style={[fStyles.label, { color: C.textMuted }]}>Gallery Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {form.gallery_urls.map((url, idx) => (
              <View key={idx} style={styles.galleryItem}>
                <Image source={{ uri: buildUrl(url) }} style={styles.galleryImg} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => setForm(p => ({ ...p, gallery_urls: p.gallery_urls.filter((_, i) => i !== idx) }))}
                >
                  <Ionicons name="close" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.galleryAdd, { borderColor: C.border }]}
              onPress={() => pickAndUpload('gallery')}
            >
              {uploadingType === 'gallery'
                ? <ActivityIndicator color={C.primary} />
                : <>
                    <Ionicons name="add" size={24} color={C.textMuted} />
                    <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '700' }}>ADD PHOTO</Text>
                  </>}
            </TouchableOpacity>
          </ScrollView>
        </Section>

        {/* ── Contact ── */}
        <Section icon="call-outline" title="Contact Information">
          <Field label="Phone Number" icon="call-outline">
            <TextInput {...inp('phone')} keyboardType="phone-pad" placeholder="+968 XXXX XXXX" style={[styles.textInput, { color: C.text, flex: 1 }]} />
          </Field>
          <Field label="WhatsApp Number" icon="logo-whatsapp">
            <TextInput {...inp('whatsapp')} keyboardType="phone-pad" placeholder="+968 XXXX XXXX" style={[styles.textInput, { color: C.text, flex: 1 }]} />
          </Field>
          <Field label="Email Address" icon="mail-outline">
            <TextInput {...inp('email')} keyboardType="email-address" autoCapitalize="none" placeholder="contact@shop.com" style={[styles.textInput, { color: C.text, flex: 1 }]} />
          </Field>
          <Field label="Website" icon="globe-outline">
            <TextInput {...inp('website')} keyboardType="url" autoCapitalize="none" placeholder="https://yourwebsite.com" style={[styles.textInput, { color: C.text, flex: 1 }]} />
          </Field>
        </Section>

        {/* ── Business Hours ── */}
        <Section icon="time-outline" title="Business Hours">
          {Object.entries(form.business_hours).map(([day, hours]) => (
            <View key={day} style={[styles.hoursRow, { borderColor: C.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, width: 100 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: hours.closed ? '#EF4444' : '#10B981' }} />
                <Text style={[styles.hoursDay, { color: C.text }]}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
              </View>

              {hours.closed ? (
                <Text style={{ flex: 1, color: C.textMuted, fontSize: 12, fontStyle: 'italic' }}>Closed</Text>
              ) : (
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TextInput
                    value={hours.open}
                    onChangeText={t => setForm(p => ({ ...p, business_hours: { ...p.business_hours, [day]: { ...hours, open: t } } }))}
                    style={[styles.hoursInput, { borderColor: C.border, color: C.text, backgroundColor: C.background }]}
                  />
                  <Text style={{ color: C.textMuted, fontSize: 11 }}>to</Text>
                  <TextInput
                    value={hours.close}
                    onChangeText={t => setForm(p => ({ ...p, business_hours: { ...p.business_hours, [day]: { ...hours, close: t } } }))}
                    style={[styles.hoursInput, { borderColor: C.border, color: C.text, backgroundColor: C.background }]}
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.toggleBtn, { backgroundColor: hours.closed ? '#D1FAE5' : '#FEE2E2' }]}
                onPress={() => setForm(p => ({ ...p, business_hours: { ...p.business_hours, [day]: { ...hours, closed: !hours.closed } } }))}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: hours.closed ? '#059669' : '#DC2626' }}>
                  {hours.closed ? 'OPEN' : 'CLOSE'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </Section>

        {/* Save button at bottom */}
        <TouchableOpacity
          style={[styles.bottomSave, { opacity: updateMu.isPending ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={updateMu.isPending}
          activeOpacity={0.85}
        >
          <LinearGradient colors={Gradients.primary} style={styles.bottomSaveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {updateMu.isPending
              ? <ActivityIndicator color="#FFF" />
              : <><Ionicons name="save-outline" size={18} color="#FFF" /><Text style={styles.bottomSaveText}>Save All Changes</Text></>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Picker Modal */}
      <PickerModal
        visible={catPickerOpen}
        title="Select Category"
        items={(categories || []).map(c => ({ id: c.id, name: c.name_en }))}
        selectedId={form.category_id}
        onSelect={id => setForm(p => ({ ...p, category_id: id }))}
        onClose={() => setCatPickerOpen(false)}
      />

      {/* Governorate Picker Modal */}
      <PickerModal
        visible={govPickerOpen}
        title="Select Governorate"
        items={(governorates || []).map(g => ({ id: g.id, name: g.name_en }))}
        selectedId={form.governorate_id}
        onSelect={id => setForm(p => ({ ...p, governorate_id: id }))}
        onClose={() => setGovPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  pageSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  // Input
  textInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, fontSize: 14, fontWeight: '500' },
  textArea: { height: 100, textAlignVertical: 'top' },

  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  pickerText: { flex: 1, fontSize: 14, fontWeight: '500' },

  // Media
  mediaBox: { height: 120, borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  mediaImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  galleryItem: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden' },
  galleryImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(239,68,68,0.9)', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  galleryAdd: { width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },

  // Hours
  hoursRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  hoursDay: { fontSize: 13, fontWeight: '700' },
  hoursInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: '600', width: 62, textAlign: 'center' },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

  // Bottom save
  bottomSave: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  bottomSaveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  bottomSaveText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

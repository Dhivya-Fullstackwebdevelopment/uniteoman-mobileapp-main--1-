import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Modal,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessApi, reviewApi, bookingApi, serviceApi } from '../../lib/apiClient';
import { Colors, Gradients } from '../../constants/Colors';
import { API_BASE_URL } from '../../constants/api';
import { BookingCreate, ServiceOut } from '../../types';
import { useFavoritesStore } from '../../store/favoritesStore';
import { THEME } from '@/components/Reuse.tsx/Reusecolor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 300;
const THUMB_HEIGHT = 96;

function buildUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('file')) return url;
  // Strip leading slash to avoid double-slash when API_BASE_URL changes
  const path = url.startsWith('/') ? url.slice(1) : url;
  return `${API_BASE_URL}/${path}`;
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};
const DAY_FULL: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

function getTodayKey() {
  return DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}

function formatHours(val: any): string {
  if (!val) return 'Closed';
  if (typeof val === 'string') return val === 'closed' ? 'Closed' : val;
  if (typeof val === 'object') {
    if (val.closed) return 'Closed';
    if (val.open && val.close) return `${val.open} – ${val.close}`;
  }
  return 'Closed';
}

function isOpenNow(hours: any): boolean {
  if (!hours) return false;
  const formatted = formatHours(hours);
  if (formatted === 'Closed') return false;
  // Simple heuristic — consider "open" if has hours today
  return formatted !== 'Closed';
}

// ─── Star Row component ──────────────────────────────────
function StarRow({ rating, size = 14, color = Colors.accent }: { rating: number; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={color}
        />
      ))}
    </View>
  );
}

// ─── Section Header ──────────────────────────────────────
function SectionHeader({
  icon,
  title,
  badge,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: number;
  action?: React.ReactNode;
}) {
  const C = Colors;
  return (
    <View style={sh.row}>
      <View style={sh.titleRow}>
        <View style={[sh.iconBox, { backgroundColor: THEME.light }]}>
          <Ionicons name={icon} size={16} color={THEME.primary} />
        </View>
        <Text style={[sh.title, { color: C.text }]}>{title}</Text>
        {badge !== undefined && badge > 0 && (
          <View style={[sh.badge, { backgroundColor: THEME.light }]}>
            <Text style={[sh.badgeText, { color: THEME.primary }]}>{badge}</Text>
          </View>
        )}
      </View>
      {action}
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
});

// ─── Input Field ─────────────────────────────────────────
function InputField({
  icon,
  label,
  value,
  onChange,
  keyboardType = 'default',
  placeholder,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: any;
  placeholder?: string;
}) {
  const C = Colors;
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>{label}</Text>
      <View style={[
        styles.inputWrap,
        { borderColor: focused ? THEME.grayBorder : C.border, backgroundColor: focused ? '#FFF' : C.divider },
      ]}>
        <View style={[styles.inputIconBox, { backgroundColor: focused ? THEME.grayLight : 'transparent' }]}>
          <Ionicons name={icon} size={15} color={focused ? THEME.grayText : C.textMuted} />
        </View>
        <TextInput
          style={[styles.inputInner, { color: C.text }]}
          placeholder={placeholder || label}
          placeholderTextColor={C.textMuted}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════
export default function BusinessDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const C = Colors;
  const queryClient = useQueryClient();

  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceOut | null>(null);
  const [bookingForm, setBookingForm] = useState<Omit<BookingCreate, 'business_id'>>({
    name: '', email: '', phone: '', service: '', date: '', time: '',
  });
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  const { data: business, isLoading, error } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => businessApi.detail(slug!),
    enabled: !!slug,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', business?.id],
    queryFn: () => reviewApi.list(business!.id),
    enabled: !!business?.id,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: () => serviceApi.listByBusiness(business!.id),
    enabled: !!business?.id,
  });

  const bookingMutation = useMutation({
    mutationFn: bookingApi.create,
    onSuccess: () => {
      Alert.alert('Booking Sent! 🎉', 'Your booking request has been submitted. The business will confirm soon.');
      setShowBooking(false);
      setBookingForm({ name: '', email: '', phone: '', service: '', date: '', time: '' });
    },
    onError: (err: any) =>
      Alert.alert('Failed', err?.response?.data?.detail ?? 'Please try again.'),
  });

  const reviewMutation = useMutation({
    mutationFn: reviewApi.create,
    onSuccess: () => {
      Alert.alert('Thanks!', 'Your review has been submitted.');
      setShowReviewForm(false);
      setReviewerName(''); setReviewComment(''); setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ['reviews', business?.id] });
    },
    onError: (err: any) =>
      Alert.alert('Failed', err?.response?.data?.detail ?? 'Please try again.'),
  });

  const handleBooking = () => {
    const { name, email, phone, date, time } = bookingForm;
    if (!name.trim() || !email.trim() || !phone.trim() || !date.trim() || !time.trim()) {
      Alert.alert('Missing Info', 'Please fill Name, Email, Phone, Date and Time.');
      return;
    }
    bookingMutation.mutate({
      ...bookingForm,
      service: selectedService?.name || bookingForm.service,
      business_id: business!.id,
    });
  };

  const openBookingForService = (svc: ServiceOut | null = null) => {
    setSelectedService(svc);
    setBookingForm((prev) => ({ ...prev, service: svc?.name || '' }));
    setShowBooking(true);
  };

  const handleSubmitReview = () => {
    if (!reviewerName.trim()) { Alert.alert('Missing', 'Enter your name.'); return; }
    reviewMutation.mutate({
      business_id: business!.id,
      reviewer_name: reviewerName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim() || undefined,
    });
  };

  const handleCall = useCallback(() => {
    if (business?.phone) Linking.openURL(`tel:${business.phone}`);
  }, [business?.phone]);

  const handleWhatsApp = useCallback(() => {
    if (business?.whatsapp) {
      const num = business.whatsapp.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${num}`);
    }
  }, [business?.whatsapp]);

  const handleShare = useCallback(async () => {
    if (!business) return;
    try {
      await Share.share({ message: `Check out ${business.name_en} on Unite Oman!` });
    } catch { }
  }, [business]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxVisible(true);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <View style={[styles.safe, { backgroundColor: C.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <View style={[styles.loaderCard, { backgroundColor: C.card }]}>
            <ActivityIndicator size="large" color={THEME.primary} />
          </View>
          <Text style={[styles.loadingText, { color: C.textMuted }]}>Loading profile…</Text>
        </View>
      </View>
    );
  }

  // ── Error ──
  if (error || !business) {
    return (
      <View style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.loadingContainer}>
          <View style={[styles.errorIconWrap, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="alert-circle-outline" size={40} color={C.error} />
          </View>
          <Text style={[styles.errorTitle, { color: C.text }]}>Business Not Found</Text>
          <Text style={[styles.errorSub, { color: C.textSecondary }]}>This listing may have been removed.</Text>
          <TouchableOpacity
            style={[styles.goBackBtn, { backgroundColor: C.primary }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={16} color="#FFF" />
            <Text style={styles.goBackBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const allImages = [business.cover_image_url, ...(business.gallery_urls || [])]
    .filter(Boolean)
    .map((url) => buildUrl(url)!);

  const logoUri = buildUrl(business.logo_url);
  const todayKey = getTodayKey();
  const todayHours = business.business_hours?.[todayKey];
  const openNow = isOpenNow(todayHours);
  const description = business.description || business.short_description || '';
  const isLongDesc = description.length > 200;

  return (
    <View style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* GALLERY  */}


        {/* ══════════ IDENTITY ══════════════════════════════════════ */}
        <View style={[styles.identityCard, { backgroundColor: C.card }]}>
          {/* Logo */}
          {logoUri && (
            <View style={[styles.logoWrap, { borderColor: C.card }]}>
              <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="cover" />
            </View>
          )}

          {/* Status badges */}
          <View style={styles.badgesRow}>
            {business.is_verified && (
              <View style={[styles.badge, { backgroundColor: Colors.successBg }]}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                <Text style={[styles.badgeText, { color: Colors.success }]}>Verified</Text>
              </View>
            )}
            {business.is_featured && (
              <View style={[styles.badge, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="star" size={12} color="#D97706" />
                <Text style={[styles.badgeText, { color: '#B45309' }]}>Featured</Text>
              </View>
            )}
            {business.has_deal && (
              <View style={[styles.badge, { backgroundColor: Colors.errorBg }]}>
                <Ionicons name="pricetag" size={12} color={Colors.error} />
                <Text style={[styles.badgeText, { color: Colors.error }]}>Deal</Text>
              </View>
            )}
            {/* Open/Closed status */}
            {todayHours && (
              <View style={[styles.badge, { backgroundColor: openNow ? Colors.successBg : '#FEE2E2' }]}>
                <View style={[styles.statusDot, { backgroundColor: openNow ? Colors.success : Colors.error }]} />
                <Text style={[styles.badgeText, { color: openNow ? Colors.success : Colors.error }]}>
                  {openNow ? 'Open Now' : 'Closed'}
                </Text>
              </View>
            )}
          </View>

          {/* Name */}
          <Text style={[styles.bizName, { color: C.text }]}>{business.name_en}</Text>
          {business.name_ar ? (
            <Text style={[styles.bizNameAr, { color: C.textSecondary }]}>{business.name_ar}</Text>
          ) : null}

          {/* Rating + meta */}
          <View style={styles.ratingMetaRow}>
            <View style={styles.ratingChip}>
              <StarRow rating={business.rating_avg} size={13} />
              <Text style={[styles.ratingNum, { color: C.text }]}>
                {business.rating_avg.toFixed(1)}
              </Text>
              <Text style={[styles.ratingCount, { color: C.textMuted }]}>
                ({business.rating_count})
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaChip}>
              <Ionicons name="pricetag-outline" size={12} color={C.textMuted} />
              <Text style={[styles.metaChipText, { color: C.textSecondary }]}>
                {business.category?.name_en}
              </Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={12} color={C.textMuted} />
              <Text style={[styles.metaChipText, { color: C.textSecondary }]}>
                {business.governorate?.name_en}
              </Text>
            </View>
          </View>

          {/* Quick action buttons */}
          <View style={styles.quickActions}>
            {business.whatsapp && (
              <TouchableOpacity style={styles.qaWhatsApp} onPress={handleWhatsApp} activeOpacity={0.85}>
                <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                <Text style={styles.qaText}>WhatsApp</Text>
              </TouchableOpacity>
            )}
            {business.phone && (
              <TouchableOpacity
                style={[styles.qaCall, { backgroundColor: THEME.primary }]}
                onPress={handleCall}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={17} color="#FFF" />
                <Text style={styles.qaText}>Call</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.qaShare, { borderColor: C.border, backgroundColor: C.divider }]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={17} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════ STATS ROW ═════════════════════════════════════ */}
        <View style={[styles.statsRow, { backgroundColor: C.card }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star" size={18} color={Colors.accent} />
            </View>
            <Text style={[styles.statValue, { color: C.text }]}>
              {business.rating_avg.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>Rating</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: C.divider }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="chatbubble-outline" size={17} color="#7C3AED" />
            </View>
            <Text style={[styles.statValue, { color: C.text }]}>{business.rating_count}</Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>Reviews</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: C.divider }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: Colors.successBg }]}>
              <Ionicons name="construct-outline" size={17} color={Colors.success} />
            </View>
            <Text style={[styles.statValue, { color: C.text }]}>{services.length}</Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>Services</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: C.divider }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="eye-outline" size={17} color="#2563EB" />
            </View>
            <Text style={[styles.statValue, { color: C.text }]}>{business.view_count ?? '—'}</Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>Views</Text>
          </View>
        </View>

        {/* ══════════ DEAL BANNER ═══════════════════════════════════ */}
        {business.has_deal && business.deal_text && (
          <View style={styles.dealBanner}>
            <LinearGradient
              colors={['#059669', '#10B981']}
              style={styles.dealGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.dealLeft}>
                <View style={styles.dealIconWrap}>
                  <Ionicons name="gift" size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dealTitle}>Special Offer</Text>
                  <Text style={styles.dealText}>{business.deal_text}</Text>
                </View>
              </View>
              <View style={styles.dealArrow}>
                <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ══════════ ABOUT ═════════════════════════════════════════ */}
        {description.length > 0 && (
          <View style={[styles.card, { backgroundColor: C.card }]}>
            <SectionHeader icon="information-circle-outline" title="About" />
            <Text
              style={[styles.descText, { color: C.textSecondary }]}
              numberOfLines={showFullDesc ? undefined : 4}
            >
              {description}
            </Text>
            {isLongDesc && (
              <TouchableOpacity
                style={styles.readMoreBtn}
                onPress={() => setShowFullDesc(!showFullDesc)}
              >
                <Text style={[styles.readMore, { color: C.primary }]}>
                  {showFullDesc ? 'Show less' : 'Read more'}
                </Text>
                <Ionicons
                  name={showFullDesc ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={C.primary}
                />
              </TouchableOpacity>
            )}
            {business.tags && business.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {business.tags.map((tag, i) => (
                  <View key={i} style={[styles.tagChip, { backgroundColor: C.primaryBg }]}>
                    <Text style={[styles.tagText, { color: C.primary }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ══════════ SERVICES ══════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: C.card }]}>
          <SectionHeader
            icon="color-wand-outline"
            title="Services"
            badge={services.length}
          />

          {services.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIconWrap, { backgroundColor: THEME.light }]}>
                <Ionicons name="construct-outline" size={28} color={THEME.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: C.text }]}>No services listed</Text>
              <Text style={[styles.emptySub, { color: C.textMuted }]}>Contact the business for availability.</Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {services.map((service, i) => (
                <View key={service.id}>
                  {i > 0 && <View style={[styles.serviceDivider, { backgroundColor: C.divider }]} />}
                  <TouchableOpacity
                    style={styles.serviceItem}
                    onPress={() => openBookingForService(service)}
                    activeOpacity={0.78}
                  >
                    {/* Accent strip */}
                    <View style={[styles.serviceAccent, { backgroundColor: THEME.primary }]} />
                    <View style={styles.serviceInfo}>
                      <Text style={[styles.serviceName, { color: C.text }]}>{service.name}</Text>
                      {service.description && (
                        <Text style={[styles.serviceDesc, { color: C.textMuted }]} numberOfLines={2}>
                          {service.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.serviceRight}>
                      <Text style={[styles.servicePrice, { color: Colors.accent }]}>
                        {service.price ? `${service.price} OMR` : 'Ask'}
                      </Text>
                      <View style={[styles.bookChip, { backgroundColor: THEME.light }]}>
                        <Text style={[styles.bookChipText, { color: THEME.primary }]}>Book</Text>
                        <Ionicons name="arrow-forward" size={11} color={THEME.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Call for Enquiry card */}
          <TouchableOpacity
            style={[styles.enquiryCard, { borderColor: C.border, backgroundColor: C.background }]}
            onPress={business.phone ? handleCall : handleWhatsApp}
            activeOpacity={0.8}
          >
            <View style={[styles.enquiryIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="call" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.enquiryTitle, { color: C.text }]}>Call for Enquiry</Text>
              <Text style={[styles.enquirySub, { color: C.textMuted }]}>
                {business.phone || business.whatsapp || 'Contact directly'}
              </Text>
            </View>
            <View style={[styles.enquiryCallBtn, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="call-outline" size={13} color="#D97706" />
              <Text style={styles.enquiryCallText}>Call</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/*  BUSINESS HOURS */}
        {business.business_hours && Object.keys(business.business_hours).length > 0 && (
          <View style={[styles.card, { backgroundColor: C.card }]}>
            <TouchableOpacity
              style={styles.hoursHeader}
              onPress={() => setShowAllHours(!showAllHours)}
              activeOpacity={0.7}
            >
              <SectionHeader
                icon="time-outline"
                title="Business Hours"
                action={
                  <Ionicons
                    name={showAllHours ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={C.textMuted}
                  />
                }
              />
            </TouchableOpacity>

            {/* Today's hours */}
            {todayHours && (
              <View style={[styles.todayRow, { backgroundColor: openNow ? Colors.successBg : Colors.errorBg }]}>
                <View style={[styles.todayDot, { backgroundColor: openNow ? Colors.success : Colors.error }]} />
                <Text style={[styles.hoursDay, { color: openNow ? Colors.success : Colors.error, fontWeight: '700' }]}>
                  {DAY_FULL[todayKey]} (Today)
                </Text>
                <Text style={[styles.hoursTime, { color: openNow ? Colors.success : Colors.error, fontWeight: '700' }]}>
                  {formatHours(todayHours)}
                </Text>
              </View>
            )}

            {/* All hours (expanded) */}
            {showAllHours && (
              <View style={styles.hoursExpanded}>
                {DAY_ORDER.map((day) => {
                  if (day === todayKey) return null;
                  const hours = business.business_hours?.[day];
                  if (!hours) return null;
                  const display = formatHours(hours);
                  const isClosed = display === 'Closed';
                  return (
                    <View key={day} style={styles.hoursRow}>
                      <Text style={[styles.hoursDay, { color: C.textSecondary }]}>{DAY_FULL[day]}</Text>
                      <Text style={[styles.hoursTime, { color: isClosed ? C.error : C.text }]}>
                        {display}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* CONTACT  */}
        <View style={[styles.card, { backgroundColor: C.card }]}>
          <SectionHeader icon="call-outline" title="Contact" />

          <View style={styles.contactBtnRow}>
            {business.whatsapp && (
              <TouchableOpacity
                style={styles.contactBtnWa}
                onPress={handleWhatsApp}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
                <Text style={styles.contactBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            )}
            {business.phone && (
              <TouchableOpacity
                style={[styles.contactBtnCall, { backgroundColor: THEME.primary }]}
                onPress={handleCall}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={19} color="#FFF" />
                <Text style={styles.contactBtnText}>Call Now</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.contactList}>
            {business.phone && (
              <View style={styles.contactRow}>
                <View style={[styles.contactIconBox, { backgroundColor: C.primaryBg }]}>
                  <Ionicons name="call-outline" size={14} color={C.primary} />
                </View>
                <Text style={[styles.contactValue, { color: C.textSecondary }]}>{business.phone}</Text>
              </View>
            )}
            {business.email && (
              <View style={styles.contactRow}>
                <View style={[styles.contactIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="mail-outline" size={14} color="#D97706" />
                </View>
                <Text style={[styles.contactValue, { color: C.textSecondary }]}>{business.email}</Text>
              </View>
            )}
            {business.website && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(business.website!)}
              >
                <View style={[styles.contactIconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="globe-outline" size={14} color="#2563EB" />
                </View>
                <Text style={[styles.contactValue, { color: C.primary }]} numberOfLines={1}>
                  {business.website}
                </Text>
                <Ionicons name="open-outline" size={12} color={C.textMuted} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
            {business.address && (
              <View style={styles.contactRow}>
                <View style={[styles.contactIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="location-outline" size={14} color={Colors.success} />
                </View>
                <Text style={[styles.contactValue, { color: C.textSecondary }]} numberOfLines={2}>
                  {business.address}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ══════════ LOCATION MAP ══════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: C.card }]}>
          <SectionHeader icon="location-outline" title="Location" />
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.mapContainer}
            onPress={() => {
              const name = encodeURIComponent(business.name_en);
              const address = encodeURIComponent(
                business.address || `${business.governorate?.name_en || ''}, Oman`,
              );
              const url = business.latitude && business.longitude
                ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
                : `https://www.google.com/maps/search/?api=1&query=${name}+${address}`;
              Linking.openURL(url);
            }}
          >
            {business.latitude && business.longitude ? (
              <Image
                source={{
                  uri: `https://maps.googleapis.com/maps/api/staticmap?center=${business.latitude},${business.longitude}&zoom=15&size=600x300&markers=color:indigo%7C${business.latitude},${business.longitude}`,
                }}
                style={styles.mapImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.mapImage, styles.mapPlaceholder]}>
                {/* <LinearGradient colors={THEME.lighgradient} style={StyleSheet.absoluteFill} /> */}
                <Ionicons name="map-outline" size={40} color={THEME.primary} />
                <Text style={{ color: THEME.primary, fontWeight: '600', fontSize: 13, marginTop: 8 }}>
                  View on Map
                </Text>
              </View>
            )}
            {/* Address bar */}
            <View style={[styles.mapBar, { backgroundColor: C.card }]}>
              <View style={[styles.mapBarIcon, { backgroundColor: THEME.light }]}>
                <Ionicons name="location" size={14} color={THEME.primary} />
              </View>
              <Text style={[styles.mapAddress, { color: C.text }]} numberOfLines={1}>
                {business.address || `${business.governorate?.name_en}, Sultanate of Oman`}
              </Text>
              <View style={[styles.openMapsChip, { borderColor: C.border }]}>
                <Ionicons name="open-outline" size={12} color={C.textMuted} />
                <Text style={[styles.openMapsText, { color: C.textMuted }]}>Open</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ══════════ REVIEWS ═══════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: C.card }]}>
          <SectionHeader
            icon="chatbubbles-outline"
            title="Reviews"
            badge={reviews?.length}
            action={
              <TouchableOpacity
                style={[styles.writeReviewBtn, { borderColor: THEME.primary, backgroundColor: THEME.light }]}
                onPress={() => setShowReviewForm(!showReviewForm)}
              >
                <Ionicons name="create-outline" size={13} color={THEME.primary} />
                <Text style={[styles.writeReviewText, { color: THEME.primary }]}>Write Review</Text>
              </TouchableOpacity>
            }
          />

          {/* Aggregate rating display */}
          {reviews && reviews.length > 0 && (
            <View style={[styles.ratingAggregate, { backgroundColor: C.background }]}>
              <View style={styles.ratingBig}>
                <Text style={[styles.ratingBigNum, { color: C.text }]}>
                  {business.rating_avg.toFixed(1)}
                </Text>
                <StarRow rating={business.rating_avg} size={16} />
                <Text style={[styles.ratingBigCount, { color: C.textMuted }]}>
                  {business.rating_count} reviews
                </Text>
              </View>
              {/* Bar chart */}
              <View style={styles.ratingBars}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length;
                  const pct = reviews.length > 0 ? count / reviews.length : 0;
                  return (
                    <View key={star} style={styles.ratingBarRow}>
                      <Text style={[styles.ratingBarLabel, { color: C.textMuted }]}>{star}</Text>
                      <Ionicons name="star" size={10} color={Colors.accent} />
                      <View style={[styles.ratingBarBg, { backgroundColor: C.divider }]}>
                        <View
                          style={[
                            styles.ratingBarFill,
                            { backgroundColor: Colors.accent, width: `${pct * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={[styles.ratingBarCount, { color: C.textMuted }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Review form */}
          {showReviewForm && (
            <View style={[styles.reviewForm, { backgroundColor: C.background, borderColor: C.border }]}>
              <Text style={[styles.reviewFormTitle, { color: C.text }]}>Share Your Experience</Text>
              <View style={[styles.inputWrap, { borderColor: C.border, backgroundColor: '#FFF', marginBottom: 0 }]}>
                <View style={[styles.inputIconBox, { backgroundColor: THEME.light }]}>
                  <Ionicons name="person-outline" size={15} color={THEME.primary} />
                </View>
                <TextInput
                  style={[styles.inputInner, { color: C.text }]}
                  placeholder="Your Name"
                  placeholderTextColor={C.textMuted}
                  value={reviewerName}
                  onChangeText={setReviewerName}
                />
              </View>
              <View style={styles.starPickerRow}>
                <Text style={[styles.rateLabel, { color: C.textSecondary }]}>Your rating:</Text>
                <View style={styles.starPicker}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setReviewRating(s)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                      <Ionicons
                        name={s <= reviewRating ? 'star' : 'star-outline'}
                        size={30}
                        color={Colors.accent}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={[styles.inputWrap, { borderColor: C.border, backgroundColor: '#FFF', alignItems: 'flex-start', paddingTop: 12 }]}>
                <View style={[styles.inputIconBox, { backgroundColor: THEME.light, marginTop: 0 }]}>
                  <Ionicons name="chatbubble-outline" size={14} color={THEME.primary} />
                </View>
                <TextInput
                  style={[styles.inputInner, styles.textArea, { color: C.text }]}
                  placeholder="Share your experience with others…"
                  placeholderTextColor={C.textMuted}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitReview}
              >
                <LinearGradient
                  colors={THEME.gradient} // Using your theme gradient for consistency
                  style={styles.submitBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {reviewMutation.isPending ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send" size={16} color="#FFF" />
                      <Text style={styles.submitBtnText}>Publish Review</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Review list */}
          {reviews && reviews.length > 0 ? (
            <View style={styles.reviewList}>
              {reviews.slice(0, 5).map((review, i) => (
                <View key={review.id}>
                  {i > 0 && <View style={[styles.reviewDivider, { backgroundColor: C.divider }]} />}
                  <View style={styles.reviewItem}>
                    <View style={styles.reviewTop}>
                      <LinearGradient
                        colors={Gradients.primary}
                        style={styles.reviewAvatar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.reviewAvatarText}>
                          {review.reviewer_name?.[0]?.toUpperCase() || '?'}
                        </Text>
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <View style={styles.reviewNameRow}>
                          <Text style={[styles.reviewName, { color: C.text }]}>
                            {review.reviewer_name}
                          </Text>
                          {review.is_verified && (
                            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                          )}
                        </View>
                        <View style={styles.reviewMeta}>
                          <StarRow rating={review.rating} size={11} />
                          <Text style={[styles.reviewDate, { color: C.textMuted }]}>
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {review.comment ? (
                      <Text style={[styles.reviewComment, { color: C.textSecondary }]}>
                        {review.comment}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIconWrap, { backgroundColor: THEME.light }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={28} color={THEME.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: C.text }]}>No reviews yet</Text>
              <Text style={[styles.emptySub, { color: C.textMuted }]}>Be the first to share your experience!</Text>
            </View>
          )}
        </View>
        {/* ══════════ PHOTO GALLERY ═════════════════ */}
        <View style={[styles.card, { backgroundColor: C.card }]}>
          <SectionHeader icon="images-outline" title="Photo Gallery" />

          <View style={styles.galleryContainer}>
            {/* Hero Image */}
            <TouchableOpacity activeOpacity={0.95} onPress={() => openLightbox(0)}>
              {allImages.length > 0 ? (
                <Image source={{ uri: allImages[0] }} style={styles.heroImage} />
              ) : (
                <View style={[styles.heroImage, styles.heroPlaceholder]}>
                  <Ionicons name="images-outline" size={50} color="#999" />
                </View>
              )}
            </TouchableOpacity>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <View style={styles.thumbRow}>
                {allImages.slice(1, 4).map((uri, i) => (
                  <TouchableOpacity key={i} onPress={() => openLightbox(i + 1)}>
                    <Image source={{ uri }} style={styles.thumbImg} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        <SafeAreaView
          style={[styles.navOverlay, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99 }]}
          edges={['top']}
        >
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.navRight}>
            <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={19} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => business && toggleFavorite(business as any)}
            >
              <Ionicons
                name={business && isFavorite(business.id) ? 'heart' : 'heart-outline'}
                size={19}
                color={business && isFavorite(business.id) ? '#F87171' : '#FFF'}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* ══════════ STICKY BOTTOM BAR ════════════════════════════════ */}
      <View style={[styles.bottomBar, { backgroundColor: C.card, borderTopColor: C.border }]}>
        <View style={styles.bottomLeft}>
          <Text style={[styles.bottomBizName, { color: C.text }]} numberOfLines={1}>
            {business.name_en}
          </Text>
          <View style={styles.bottomRating}>
            <Ionicons name="star" size={12} color={Colors.accent} />
            <Text style={[styles.bottomRatingText, { color: C.textSecondary }]}>
              {business.rating_avg.toFixed(1)} · {business.rating_count} reviews
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.bookNowWrap}
          onPress={() => setShowBooking(true)}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={THEME.gradient}
            style={styles.bookNowBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="calendar-outline" size={17} color="#FFF" />
            <Text style={styles.bookNowText}>Book Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ══════════ LIGHTBOX MODAL ════════════════════════════════════ */}
      <Modal visible={lightboxVisible} animationType="fade" transparent statusBarTranslucent>
        <View style={styles.lightboxOverlay}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View style={styles.lightboxHeader}>
              <TouchableOpacity onPress={() => setLightboxVisible(false)} style={styles.lightboxClose}>
                <View style={styles.lightboxCloseBtn}>
                  <Ionicons name="close" size={22} color="#FFF" />
                </View>
              </TouchableOpacity>
              <View style={styles.lightboxCounterWrap}>
                <Text style={styles.lightboxCounter}>{lightboxIndex + 1} / {allImages.length}</Text>
              </View>
              <View style={{ width: 44 }} />
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: lightboxIndex * SCREEN_WIDTH, y: 0 }}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setLightboxIndex(idx);
              }}
              style={{ flex: 1 }}
            >
              {allImages.map((uri, i) => (
                <View
                  key={i}
                  style={{ width: SCREEN_WIDTH, flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Image source={{ uri }} style={styles.lightboxImage} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
            {allImages.length > 1 && (
              <View style={styles.lightboxDots}>
                {allImages.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.lbDot,
                      i === lightboxIndex && styles.lbDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* ══════════ BOOKING MODAL ════════════════════════════════════ */}
      <Modal visible={showBooking} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: C.card }]}>
            {/* Pill handle */}
            <View style={[styles.sheetHandle, { backgroundColor: C.border }]} />

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <LinearGradient colors={THEME.gradient} style={styles.modalHeaderIcon}>
                  <Ionicons name="calendar" size={20} color="#FFF" />
                </LinearGradient>
                <View>
                  <Text style={[styles.modalTitle, { color: C.text }]}>Book Appointment</Text>
                  <Text style={[styles.modalSub, { color: C.textMuted }]}>{business.name_en}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: C.divider }]}
                onPress={() => setShowBooking(false)}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Service chips */}
              {services.length > 0 && (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Select Service</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.serviceChip,
                        !selectedService && { backgroundColor: THEME.primary, borderColor: THEME.primary },
                      ]}
                      onPress={() => setSelectedService(null)}
                    >
                      <Text style={[styles.serviceChipText, { color: !selectedService ? '#FFF' : C.text }]}>
                        Any
                      </Text>
                    </TouchableOpacity>
                    {services.map((svc) => (
                      <TouchableOpacity
                        key={svc.id}
                        style={[
                          styles.serviceChip,
                          selectedService?.id === svc.id && {
                            backgroundColor: THEME.primary,
                            borderColor: THEME.primary,
                          },
                        ]}
                        onPress={() => setSelectedService(svc)}
                      >
                        <Text
                          style={[
                            styles.serviceChipText,
                            { color: selectedService?.id === svc.id ? '#FFF' : C.text },
                          ]}
                        >
                          {svc.name}
                          {svc.price ? ` · ${svc.price} OMR` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <InputField
                icon="person-outline"
                label="Full Name"
                value={bookingForm.name}
                onChange={(v) => setBookingForm((p) => ({ ...p, name: v }))}
              />
              <InputField
                icon="mail-outline"
                label="Email Address"
                value={bookingForm.email}
                onChange={(v) => setBookingForm((p) => ({ ...p, email: v }))}
                keyboardType="email-address"
              />
              <InputField
                icon="call-outline"
                label="Phone Number"
                value={bookingForm.phone}
                onChange={(v) => setBookingForm((p) => ({ ...p, phone: v }))}
                keyboardType="phone-pad"
              />
              <InputField
                icon="calendar-outline"
                label="Preferred Date"
                placeholder="YYYY-MM-DD"
                value={bookingForm.date}
                onChange={(v) => setBookingForm((p) => ({ ...p, date: v }))}
              />
              <InputField
                icon="time-outline"
                label="Preferred Time"
                placeholder="e.g. 10:00 AM"
                value={bookingForm.time}
                onChange={(v) => setBookingForm((p) => ({ ...p, time: v }))}
              />

              <TouchableOpacity
                style={[styles.submitBtn, { marginTop: 8 }]}
                onPress={handleBooking}
              >
                <LinearGradient
                  colors={THEME.gradient}
                  style={styles.submitBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {bookingMutation.isPending ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="calendar-outline" size={18} color="#FFF" />
                      <Text style={styles.submitBtnText}>Confirm Booking</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Direct contact shortcuts */}
              {(business.whatsapp || business.phone) && (
                <View style={styles.modalContactRow}>
                  <Text style={[styles.orText, { color: C.textMuted }]}>or reach directly</Text>
                  {business.whatsapp && (
                    <TouchableOpacity
                      style={styles.contactBtnWa}
                      onPress={handleWhatsApp}
                    >
                      <Ionicons name="logo-whatsapp" size={17} color="#FFF" />
                      <Text style={styles.contactBtnText}>Chat on WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                  {business.phone && (
                    <TouchableOpacity
                      style={[styles.contactBtnCall, { backgroundColor: THEME.primary }]}
                      onPress={handleCall}
                    >
                      <Ionicons name="call" size={17} color="#FFF" />
                      <Text style={styles.contactBtnText}>Call {business.phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // ── Loading / Error ──────────────────────────────────────
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  loaderCard: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  loadingText: { fontSize: 14, fontWeight: '500' },
  errorIconWrap: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  errorTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  errorSub: { fontSize: 14, fontWeight: '500' },
  goBackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: 14, marginTop: 4,
  },
  goBackBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // ── Gallery ──────────────────────────────────────────────

  heroImage: { width: SCREEN_WIDTH, height: HERO_HEIGHT, borderRadius: 20 },
  galleryContainer: { position: 'relative', backgroundColor: '#0F172A', borderRadius: 20, overflow: 'hidden' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
  },
  thumbRow: {
    flexDirection: 'row', gap: 4, marginTop: 4,
    paddingHorizontal: 4,
  },
  thumbWrap: {
    flex: 1, height: THUMB_HEIGHT,
    borderRadius: 12, overflow: 'hidden',
  },
  thumbImg: {
    width: '100%', height: '100%',
    borderRadius: 12,
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center', justifyContent: 'center',
  },
  moreText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  photoCountBadge: {
    position: 'absolute',
    bottom: THUMB_HEIGHT + 14,
    right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  photoCountText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  navOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 4,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center', justifyContent: 'center',
  },
  navRight: { flexDirection: 'row', gap: 10 },

  // ── Identity Card ────────────────────────────────────────
  identityCard: {
    marginHorizontal: 16, marginTop: 50, borderRadius: 22,
    padding: 20, paddingTop: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 10,
  },
  logoWrap: {
    width: 64, height: 64, borderRadius: 18,
    borderWidth: 3, overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  logo: { width: '100%', height: '100%' },
  badgesRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  bizName: {
    fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4,
  },
  bizNameAr: {
    fontSize: 17, fontWeight: '600', marginBottom: 10, textAlign: 'right',
  },
  ratingMetaRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 6,
  },
  ratingChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingNum: { fontSize: 14, fontWeight: '800' },
  ratingCount: { fontSize: 13 },
  metaDivider: { width: 1, height: 14, backgroundColor: Colors.border },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaChipText: { fontSize: 13, fontWeight: '500' },

  // Quick action buttons
  quickActions: {
    flexDirection: 'row', gap: 10, marginTop: 18,
  },
  qaWhatsApp: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13, borderRadius: 14, backgroundColor: '#25D366',
  },
  qaCall: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13, borderRadius: 14,
  },
  qaShare: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  qaText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // ── Stats Row ────────────────────────────────────────────
  statsRow: {
    marginHorizontal: 16, marginTop: 14, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 18,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 5 },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 40 },

  // ── Deal Banner ──────────────────────────────────────────
  dealBanner: {
    marginHorizontal: 16, marginTop: 14, borderRadius: 18, overflow: 'hidden',
  },
  dealGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 16,
  },
  dealLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dealIconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  dealTitle: { color: '#FFF', fontWeight: '800', fontSize: 15, marginBottom: 2 },
  dealText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  dealArrow: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Generic Card ─────────────────────────────────────────
  card: {
    marginHorizontal: 16, marginTop: 14, borderRadius: 20, padding: 20,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },

  // ── About ────────────────────────────────────────────────
  descText: { fontSize: 14, lineHeight: 23, fontWeight: '400' },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  readMore: { fontSize: 14, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  tagText: { fontSize: 12, fontWeight: '600' },

  // ── Services ─────────────────────────────────────────────
  servicesList: { marginBottom: 6 },
  serviceDivider: { height: 1 },
  serviceItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingLeft: 0, gap: 12,
    overflow: 'hidden',
  },
  serviceAccent: { width: 3, height: '100%', borderRadius: 2, alignSelf: 'stretch' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '700', marginBottom: 3, letterSpacing: -0.1 },
  serviceDesc: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
  serviceRight: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  servicePrice: { fontSize: 15, fontWeight: '800' },
  bookChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  bookChipText: { fontSize: 11, fontWeight: '700' },

  // Enquiry card
  enquiryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 14, padding: 14, borderRadius: 16, borderWidth: 1.5,
  },
  enquiryIcon: {
    width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
  },
  enquiryTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  enquirySub: { fontSize: 12, fontWeight: '500' },
  enquiryCallBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
  },
  enquiryCallText: { fontSize: 12, fontWeight: '700', color: '#D97706' },

  // ── Hours ────────────────────────────────────────────────
  hoursHeader: { marginBottom: -6 },
  todayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
    marginBottom: 2,
  },
  todayDot: { width: 8, height: 8, borderRadius: 4 },
  hoursExpanded: { marginTop: 6 },
  hoursRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 4,
  },
  hoursDay: { fontSize: 14, flex: 1 },
  hoursTime: { fontSize: 14, fontWeight: '600' },

  // ── Contact ──────────────────────────────────────────────
  contactBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  contactBtnWa: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: '#25D366',
  },
  contactBtnCall: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  contactBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  contactList: { gap: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIconBox: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  contactValue: { fontSize: 14, fontWeight: '500', flex: 1 },

  // ── Map ──────────────────────────────────────────────────
  mapContainer: { borderRadius: 16, overflow: 'hidden' },
  mapImage: { width: '100%', height: 170 },
  mapPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  mapBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  mapBarIcon: {
    width: 30, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  mapAddress: { flex: 1, fontSize: 13, fontWeight: '500' },
  openMapsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  openMapsText: { fontSize: 11, fontWeight: '600' },

  // ── Reviews ──────────────────────────────────────────────
  writeReviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
  },
  writeReviewText: { fontSize: 12, fontWeight: '700' },

  ratingAggregate: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14,
    marginBottom: 16, gap: 16,
  },
  ratingBig: { alignItems: 'center', gap: 6, width: 80 },
  ratingBigNum: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  ratingBigCount: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  ratingBars: { flex: 1, gap: 5 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingBarLabel: { fontSize: 11, fontWeight: '600', width: 10, textAlign: 'right' },
  ratingBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  ratingBarFill: { height: '100%', borderRadius: 3 },
  ratingBarCount: { fontSize: 11, width: 16, textAlign: 'right' },

  reviewForm: {
    borderWidth: 1.5, borderRadius: 16, padding: 16, marginBottom: 16, gap: 12,
  },
  reviewFormTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  starPickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  starPicker: { flexDirection: 'row', gap: 4 },
  rateLabel: { fontSize: 13, fontWeight: '600' },

  reviewList: {},
  reviewDivider: { height: 1 },
  reviewItem: { paddingVertical: 14 },
  reviewTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  reviewAvatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  reviewAvatarText: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  reviewName: { fontSize: 14, fontWeight: '700' },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewDate: { fontSize: 11 },
  reviewComment: { fontSize: 13, lineHeight: 20, fontWeight: '400' },

  // ── Empty states ─────────────────────────────────────────
  emptyBox: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  // ── Bottom Bar ───────────────────────────────────────────
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 12,
  },
  bottomLeft: { flex: 1, marginRight: 12 },
  bottomBizName: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2, marginBottom: 3 },
  bottomRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bottomRatingText: { fontSize: 12, fontWeight: '500' },
  bookNowWrap: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  bookNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
  },
  bookNowText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.1 },

  // ── Lightbox ─────────────────────────────────────────────
  lightboxOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' },
  lightboxHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  lightboxClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  lightboxCloseBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  lightboxCounterWrap: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  lightboxCounter: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  lightboxImage: { width: SCREEN_WIDTH - 16, height: '80%' },
  lightboxDots: {
    flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 24,
  },
  lbDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.28)',
  },
  lbDotActive: { backgroundColor: '#FFF', width: 20, borderRadius: 4 },

  // ── Booking Modal ─────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 0, maxHeight: '92%',
  },
  sheetHandle: {
    width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalHeaderIcon: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  modalSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Form inputs ───────────────────────────────────────────
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 7, letterSpacing: 0.1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 8, paddingVertical: 6,
  },
  inputIconBox: {
    width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  inputInner: { flex: 1, fontSize: 14, fontWeight: '400', paddingVertical: 7 },
  textArea: { textAlignVertical: 'top', minHeight: 70 },

  // Service chips
  serviceChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22,
    backgroundColor: Colors.divider,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  serviceChipText: { fontSize: 13, fontWeight: '600' },

  // Submit button
  // submitBtn: {
  //   borderRadius: 16, overflow: 'hidden',
  //   shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  // },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'stretch',
    marginTop: 16,
  },
  // submitBtnGradient: {
  //   flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  //   gap: 8, paddingVertical: 17,
  // },
  // submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    width: '100%',
  },

  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  modalContactRow: { gap: 10, marginTop: 18 },
  orText: { textAlign: 'center', fontSize: 13, fontWeight: '500', marginBottom: 4 },
  galleryTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.card,
  },
  galleryTitle: {
    fontSize: 18, fontWeight: '800', color: Colors.text, letterSpacing: -0.3,
  },
  viewAllOverlay: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 10,
  },
  viewAllText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
});

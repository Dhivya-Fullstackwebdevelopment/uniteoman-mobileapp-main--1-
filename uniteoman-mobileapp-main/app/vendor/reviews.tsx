import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { reviewApi } from '../../lib/apiClient';
import { Colors } from '../../constants/Colors';
import { THEME } from '@/components/Reuse.tsx/Reusecolor';

export default function VendorReviewsScreen() {
  const C = Colors;

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['vendor-reviews'],
    queryFn: () => reviewApi.me(),
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const avg = reviews?.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.background }]} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      
      {/* Header Stats Component */}
      <View style={[styles.headerCard, { backgroundColor: THEME.primary }]}>
        <View style={styles.headerLeft}>
           <Text style={styles.headerValue}>{avg}</Text>
           <View style={{ flexDirection: 'row', gap: 2 }}>
             {[1, 2, 3, 4, 5].map(s => (
               <Ionicons key={s} name="star" size={16} color={s <= parseFloat(avg) ? '#FBBF24' : 'rgba(255,255,255,0.3)'} />
             ))}
           </View>
        </View>
        <View style={styles.headerRight}>
           <Text style={styles.headerTotal}>{reviews?.length || 0}</Text>
           <Text style={styles.headerLabel}>Total Reviews</Text>
        </View>
      </View>

      <Text style={[styles.pageTitle, { color: C.text }]}>Recent Feedback</Text>

      {(!reviews || reviews.length === 0) ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: THEME.light }]}>
            <Ionicons name="star-half-outline" size={32} color={THEME.primary} />
          </View>
          <Text style={[styles.emptyText, { color: C.text }]}>No Reviews Yet</Text>
          <Text style={[styles.emptySub, { color: C.textSecondary }]}>When customers review your shops, they will appear here.</Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {reviews.map((review) => (
            <View key={review.id} style={[styles.reviewCard, { backgroundColor: C.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.reviewerAvatar}>
                  <Text style={styles.avatarText}>{review.reviewer_name?.[0]?.toUpperCase() || 'U'}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.reviewerName, { color: C.text }]} numberOfLines={1}>{review.reviewer_name}</Text>
                    {review.is_verified && <Ionicons name="checkmark-circle" size={14} color="#10B981" />}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Ionicons key={s} name="star" size={12} color={s <= review.rating ? '#FBBF24' : C.divider} />
                      ))}
                    </View>
                    <Text style={[styles.dateText, { color: C.textSecondary }]}>{new Date(review.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>

              {review.comment ? (
                <Text style={[styles.commentText, { color: C.textSecondary }]}>{review.comment}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  headerCard: { flexDirection: 'row', padding: 24, borderRadius: 24, marginBottom: 24, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  headerLeft: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  headerValue: { fontSize: 36, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  headerRight: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTotal: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  headerLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  pageTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  reviewCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  reviewerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: THEME.light, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: THEME.primary, fontSize: 18, fontWeight: '800' },
  reviewerName: { fontSize: 15, fontWeight: '800' },
  dateText: { fontSize: 12, fontWeight: '500' },
  commentText: { fontSize: 14, lineHeight: 20, marginTop: 4 },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { bookingApi } from '../../lib/apiClient';
import { Colors } from '../../constants/Colors';
import { BookingOut } from '../../types';

function StatusBadge({ status }: { status: BookingOut['status'] }) {
  const isPending = status === 'pending';
  const isConfirmed = status === 'confirmed';
  const color = isConfirmed ? '#10B981' : isPending ? '#F59E0B' : '#6B7280';
  const bg = isConfirmed ? '#D1FAE5' : isPending ? '#FEF3C7' : '#F3F4F6';

  return (
    <View style={[{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }]}>
      <Text style={{ color, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>{status}</Text>
    </View>
  );
}

export default function VendorAppointmentsScreen() {
  const qc = useQueryClient();
  const C = Colors;

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['vendor-bookings'],
    queryFn: () => bookingApi.vendorList(),
  });

  const updateStatusMu = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'confirmed' | 'cancelled' }) => bookingApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-bookings'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update booking status.');
    }
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.background }]} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={[styles.pageTitle, { color: C.text }]}>Appointments</Text>

      {(!bookings || bookings.length === 0) ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: C.divider }]}>
            <Ionicons name="calendar" size={32} color={C.textMuted} />
          </View>
          <Text style={[styles.emptyText, { color: C.text }]}>No Appointments</Text>
          <Text style={[styles.emptySub, { color: C.textSecondary }]}>You don't have any customer bookings yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {bookings.map((booking) => (
            <View key={booking.id} style={[styles.bookingCard, { backgroundColor: C.card }]}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.bookingName, { color: C.text }]}>{booking.name}</Text>
                  <Text style={[styles.bookingService, { color: C.primary }]}>{booking.service || 'General Booking'}</Text>
                </View>
                <StatusBadge status={booking.status} />
              </View>

              <View style={[styles.divider, { backgroundColor: C.divider }]} />

              {/* Details */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color={C.textSecondary} />
                  <Text style={[styles.detailText, { color: C.textSecondary }]}>{booking.date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color={C.textSecondary} />
                  <Text style={[styles.detailText, { color: C.textSecondary }]}>{booking.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="call-outline" size={16} color={C.textSecondary} />
                  <Text style={[styles.detailText, { color: C.textSecondary }]}>{booking.phone}</Text>
                </View>
              </View>

              {/* Actions */}
              {booking.status === 'pending' && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#FEE2E2', flex: 1 }]}
                    onPress={() => updateStatusMu.mutate({ id: booking.id, status: 'cancelled' })}
                  >
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#D1FAE5', flex: 1 }]}
                    onPress={() => updateStatusMu.mutate({ id: booking.id, status: 'confirmed' })}
                  >
                    <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  pageTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  bookingCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  bookingName: { fontSize: 16, fontWeight: '800' },
  bookingService: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: 16, opacity: 0.5 },
  detailsRow: { gap: 10, marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '800' },
});

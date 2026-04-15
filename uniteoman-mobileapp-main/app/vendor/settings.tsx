import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { THEME } from '@/components/Reuse.tsx/Reusecolor';

export default function VendorSettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [autoAcceptEnabled, setAutoAcceptEnabled] = React.useState(false);
  const C = Colors;
  const { user } = useAuthStore();

  const handleAction = (title: string) => {
    Alert.alert(title, 'This feature will be available in the next update.');
  };

  const menuSections = [
    {
      title: 'Business Setup',
      items: [
        { icon: 'time-outline', label: 'Business Hours', onPress: () => handleAction('Business Hours') },
        { icon: 'location-outline', label: 'Service Coverage', onPress: () => handleAction('Service Coverage') },
        { icon: 'card-outline', label: 'Payout Methods', onPress: () => handleAction('Payout Methods') },
      ],
    },
    {
      title: 'Subscription & Billing',
      items: [
        { icon: 'star-outline', label: 'Current Plan: Premium', subtitle: 'Active until Jan 2025', onPress: () => handleAction('Subscription Plan') },
        { icon: 'receipt-outline', label: 'Billing History', onPress: () => handleAction('Billing History') },
      ],
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.background }]} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      
      {/* Account Info */}
      <View style={[styles.infoCard, { backgroundColor: THEME.primary }]}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || 'V'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoEmail} numberOfLines={1}>{user?.email}</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Verified Vendor</Text>
            <Ionicons name="checkmark-circle" size={14} color="#FFF" />
          </View>
        </View>
      </View>

      {/* Toggles Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: C.card }]}>
          <View style={[styles.toggleRow, { borderBottomWidth: 1, borderBottomColor: C.divider }]}>
             <View style={styles.toggleLeft}>
               <Ionicons name="notifications-outline" size={20} color={C.text} />
               <Text style={[styles.toggleLabel, { color: C.text }]}>Push Notifications</Text>
             </View>
             <Switch 
               value={notificationsEnabled} 
               onValueChange={setNotificationsEnabled}
               trackColor={{ false: C.divider, true: C.primary }}
             />
          </View>
          <View style={styles.toggleRow}>
             <View style={styles.toggleLeft}>
               <Ionicons name="flash-outline" size={20} color={THEME.primary} />
               <View>
                 <Text style={[styles.toggleLabel, { color: C.text }]}>Auto-Accept Bookings</Text>
                 <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Confirm automatically if timeslot is free</Text>
               </View>
             </View>
             <Switch 
               value={autoAcceptEnabled} 
               onValueChange={setAutoAcceptEnabled}
               trackColor={{ false: C.divider, true: C.primary }}
             />
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      {menuSections.map((section, sIdx) => (
        <View key={sIdx} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>{section.title.toUpperCase()}</Text>
          <View style={[styles.card, { backgroundColor: C.card }]}>
            {section.items.map((item, iIdx) => (
              <TouchableOpacity
                key={iIdx}
                style={[styles.menuRow, iIdx < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.divider }]}
                onPress={item.onPress} 
                activeOpacity={0.7} >
                <View style={styles.menuLeft}>
                  <Ionicons name={item.icon as any} size={20} color={C.textSecondary} />
                  <View>
                    <Text style={[styles.menuLabel, { color: C.text }]}>{item.label}</Text>
                    {item.subtitle && <Text style={[styles.menuSub, { color: C.textMuted }]}>{item.subtitle}</Text>}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={[styles.logoutBtn, { borderColor: C.error }]} onPress={() => Alert.alert('Logout', 'Are you sure you want to sign out?')} activeOpacity={0.7}>
        <Text style={[styles.logoutText, { color: C.error }]}>Sign Out of Vendor Portal</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  infoCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 24, gap: 16, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  avatarBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  infoEmail: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 6 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12, paddingHorizontal: 4 },
  card: { borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 16 },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuSub: { fontSize: 12, marginTop: 2 },
  logoutBtn: { borderWidth: 1.5, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderStyle: 'dashed' },
  logoutText: { fontSize: 14, fontWeight: '800' }
});

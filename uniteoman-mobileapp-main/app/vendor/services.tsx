import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { businessApi, serviceApi } from '../../lib/apiClient';
import { Colors } from '../../constants/Colors';
import { ServiceCreate } from '../../types';

export default function VendorServicesScreen() {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: '' });
  
  const qc = useQueryClient();
  const C = Colors;

  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ['vendor-shops'],
    queryFn: () => businessApi.me(),
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', selectedShopId],
    queryFn: () => serviceApi.listByBusiness(selectedShopId!),
    enabled: !!selectedShopId,
  });

  const addServiceMu = useMutation({
    mutationFn: (payload: ServiceCreate) => serviceApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', selectedShopId] });
      setNewService({ name: '', description: '', price: '' });
      setIsAdding(false);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add service.');
    }
  });

  const deleteServiceMu = useMutation({
    mutationFn: (id: string) => serviceApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', selectedShopId] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete service.');
    }
  });

  const handleAdd = () => {
    if (!newService.name.trim()) return Alert.alert('Missing Field', 'Please enter a service name.');
    addServiceMu.mutate({ ...newService, business_id: selectedShopId! });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Service', 'Are you sure you want to delete this service?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteServiceMu.mutate(id) }
    ]);
  };

  if (shopsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={[styles.container, { backgroundColor: C.background }]} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        
        <View style={styles.shopSelector}>
          <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>SELECT SHOP TO MANAGE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20, paddingBottom: 16 }}>
            {shops?.map(shop => (
              <TouchableOpacity 
                key={shop.id} 
                style={[
                  styles.shopChip, 
                  { backgroundColor: selectedShopId === shop.id ? C.primary : C.card, borderColor: selectedShopId === shop.id ? C.primary : C.border }
                ]}
                onPress={() => setSelectedShopId(shop.id)}
              >
                <Text style={{ color: selectedShopId === shop.id ? '#FFF' : C.text, fontWeight: '700', fontSize: 13 }}>{shop.name_en}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedShopId && (
          <View style={styles.contentArea}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: C.text }]}>Active Services</Text>
              {!isAdding && (
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: C.primary }]} onPress={() => setIsAdding(true)}>
                  <Ionicons name="add-circle" size={18} color="#FFF" />
                  <Text style={styles.addBtnText}>Add Service</Text>
                </TouchableOpacity>
              )}
            </View>

            {isAdding && (
              <View style={[styles.addForm, { backgroundColor: C.primaryBg, borderColor: C.primary }]}>
                <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} placeholder="Service Name (e.g. Haircut)" value={newService.name} onChangeText={t => setNewService({...newService, name: t})} />
                <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} placeholder="Price (e.g. 5 OMR)" value={newService.price} onChangeText={t => setNewService({...newService, price: t})} />
                <TextInput style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]} placeholder="Description (Optional)" value={newService.description} onChangeText={t => setNewService({...newService, description: t})} />
                
                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAdding(false)}>
                    <Text style={[styles.cancelBtnText, { color: C.textMuted }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.primary }]} onPress={handleAdd} disabled={addServiceMu.isPending}>
                    {addServiceMu.isPending ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save Service</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {servicesLoading ? (
               <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 40 }} />
            ) : services?.length === 0 && !isAdding ? (
              <View style={styles.emptyState}>
                <Ionicons name="color-wand-outline" size={48} color={C.textMuted} style={{ marginBottom: 12, opacity: 0.5 }} />
                <Text style={[styles.emptyText, { color: C.textMuted }]}>No services added yet.</Text>
              </View>
            ) : (
              <View style={styles.serviceList}>
                {services?.map(s => (
                  <View key={s.id} style={[styles.serviceCard, { backgroundColor: C.card, borderColor: C.divider }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.serviceName, { color: C.text }]}>{s.name}</Text>
                      <Text style={[styles.serviceDesc, { color: C.textSecondary }]}>{s.description || 'No description'} • <Text style={{ color: C.primary }}>{s.price || 'Price on request'}</Text></Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(s.id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  shopSelector: { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 12, paddingHorizontal: 2 },
  shopChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 10 },
  contentArea: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6 },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  addForm: { padding: 16, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 20, gap: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { fontSize: 13, fontWeight: '700' },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  saveBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  serviceList: { gap: 12 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  serviceName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  serviceDesc: { fontSize: 12, fontWeight: '600' },
  deleteBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
});

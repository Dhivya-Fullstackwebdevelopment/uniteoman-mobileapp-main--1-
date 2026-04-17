import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';
import React from 'react';
import Toast from 'react-native-toast-message';


export default function VendorLayout() {
  return (
    <>
    <Stack screenOptions={{
      headerStyle: { backgroundColor: Colors.background },
      headerTintColor: Colors.text,
      headerTitleStyle: { fontWeight: '800' },
      headerBackTitleVisible: false,
      headerShadowVisible: false,
      contentStyle: { backgroundColor: Colors.background },
    }}>
      <Stack.Screen name="dashboard" options={{ title: 'Vendor Dashboard' }} />
      <Stack.Screen name="shops" options={{ title: 'My Shops' }} />
      <Stack.Screen name="appointments" options={{ title: 'Appointments' }} />
      <Stack.Screen name="services" options={{ title: 'Services' }} />
      <Stack.Screen name="reviews" options={{ title: 'Reviews' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
     <Toast /> 
         </>

  );
}

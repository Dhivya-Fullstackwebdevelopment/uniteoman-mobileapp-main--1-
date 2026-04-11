import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface Props {
  message?: string;
}

export default function LoadingScreen({ message }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.loaderCard}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 18,
  },
  loaderCard: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});

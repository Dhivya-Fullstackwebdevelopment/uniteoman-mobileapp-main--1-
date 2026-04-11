import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface Props {
  rating: number;
  size?: number;
  maxStars?: number;
}

export default function StarRating({ rating, size = 14, maxStars = 5 }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <Ionicons
            key={i}
            name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
            size={size}
            color={filled || half ? Colors.star : Colors.border}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1 },
});

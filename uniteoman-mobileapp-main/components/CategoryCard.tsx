import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Category } from '../types';

interface Props {
  category: Category;
  onPress: () => void;
  selected?: boolean;
}

export default function CategoryCard({ category, onPress, selected = false }: Props) {
  const C = Colors;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: selected ? C.primary : C.card,
          borderColor: selected ? C.primary : C.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconCircle, { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : C.primaryBg }]}>
        <Text style={styles.icon}>{category.icon || '🏢'}</Text>
      </View>
      <Text
        style={[styles.name, { color: selected ? '#FFFFFF' : C.text }]}
        numberOfLines={1}
      >
        {category.name_en}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 80,
    marginRight: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 22,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

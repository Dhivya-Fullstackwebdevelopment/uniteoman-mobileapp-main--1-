import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { THEME } from './Reuse.tsx/Reusecolor';

interface Props {
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  onClear?: () => void;
  placeholder?: string;
  readonly?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({
  value,
  onChangeText,
  onPress,
  onClear,
  placeholder = 'Search...',
  readonly = false,
  autoFocus = false,
}: Props) {
  const C = Colors;

  if (readonly) {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: C.card, borderColor: C.border }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={[styles.iconWrap, { backgroundColor: THEME.light }]}>
          <Ionicons name="search" size={16} color={THEME.primary} />
        </View>
        <TextInput
          style={[styles.input, { color: C.textMuted }]}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          editable={false}
          pointerEvents="none"
        />
        <View style={[styles.filterIconWrap, { backgroundColor: C.divider }]}>
          <Ionicons name="options-outline" size={16} color={C.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.card, borderColor: C.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: THEME.light }]}>
        <Ionicons name="search" size={16} color={THEME.primary} />
      </View>
      <TextInput
        style={[styles.input, { color: C.text }]}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value && value.length > 0 && (
        <TouchableOpacity
          onPress={onClear}
          style={styles.clearBtn}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <View style={[styles.clearIconWrap, { backgroundColor: C.border }]}>
            <Ionicons name="close" size={12} color={C.textSecondary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
  },
  filterIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: { flexShrink: 0 },
  clearIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

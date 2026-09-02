import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../../lib/theme';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  style,
  disabled,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'soft';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const pal = {
    primary: { bg: colors.text, fg: '#fff' },
    ghost: { bg: colors.muted, fg: colors.text },
    danger: { bg: colors.red, fg: '#fff' },
    success: { bg: colors.green, fg: '#fff' },
    soft: { bg: colors.blueSoft, fg: colors.blue },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: pal.bg, opacity: pressed || disabled ? 0.72 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={pal.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={16} color={pal.fg} /> : null}
          <Text style={[styles.txt, { color: pal.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txt: { fontFamily: font.semibold, fontSize: 14, letterSpacing: -0.2 },
});

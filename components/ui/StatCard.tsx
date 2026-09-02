import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, radius, type } from '../../lib/theme';

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: accent ?? colors.blue }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    paddingTop: 14,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 2,
  },
  label: {
    ...type.label,
    marginLeft: 8,
    marginBottom: 8,
  },
  value: {
    ...type.metric,
    marginLeft: 8,
  },
  hint: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.secondary,
    marginLeft: 8,
    marginTop: 4,
  },
});

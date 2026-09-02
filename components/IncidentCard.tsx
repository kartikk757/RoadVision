import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';
import { Incident } from '../lib/types';
import { defectLabel } from '../lib/mockData';
import { pct, timeAgo } from '../lib/format';
import { StatusBadge } from './ui/StatusBadge';

export function IncidentCard({
  item,
  onPress,
}: {
  item: Incident;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.86 }]}>
      <View style={styles.top}>
        <Text style={styles.id}>{item.id}</Text>
        <StatusBadge kind={item.severity === 'resolved' ? 'resolved' : item.severity} />
      </View>
      <Text style={styles.title}>{defectLabel[item.type]}</Text>
      <View style={styles.meta}>
        <Ionicons name="navigate-outline" size={13} color={colors.secondary} />
        <Text style={styles.metaTxt} numberOfLines={1}>
          {item.location.road} · {item.location.city}
        </Text>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.conf}>{pct(item.confidence)} AI</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.metaTxt}>{item.cameraId}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.metaTxt}>{timeAgo(item.timestamp)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontFamily: font.medium, fontSize: 12, color: colors.secondary, letterSpacing: 0.4 },
  title: { fontFamily: font.semibold, fontSize: 16, color: colors.text, marginTop: 8, letterSpacing: -0.3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  metaTxt: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, flexShrink: 1 },
  bottom: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  conf: { fontFamily: font.semibold, fontSize: 12, color: colors.purple },
  dot: { color: colors.border },
});

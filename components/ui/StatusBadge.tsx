import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, radius } from '../../lib/theme';
import { Severity, CameraStatus, ComplaintStatus, EvidenceStatus } from '../../lib/types';
import { severityLabel, statusLabel } from '../../lib/mockData';

const palettes: Record<string, { bg: string; fg: string; dot: string }> = {
  critical: { bg: colors.redSoft, fg: colors.red, dot: colors.red },
  moderate: { bg: colors.amberSoft, fg: colors.amber, dot: colors.amber },
  low: { bg: colors.blueSoft, fg: colors.blue, dot: colors.blue },
  resolved: { bg: colors.greenSoft, fg: colors.green, dot: colors.green },
  online: { bg: colors.greenSoft, fg: colors.green, dot: colors.green },
  offline: { bg: colors.redSoft, fg: colors.red, dot: colors.red },
  connecting: { bg: colors.purpleSoft, fg: colors.purple, dot: colors.purple },
  testing: { bg: colors.amberSoft, fg: colors.amber, dot: colors.amber },
  detected: { bg: colors.purpleSoft, fg: colors.purple, dot: colors.purple },
  verified: { bg: colors.blueSoft, fg: colors.blue, dot: colors.blue },
  authority_identified: { bg: colors.blueSoft, fg: colors.blue, dot: colors.blue },
  sent: { bg: colors.amberSoft, fg: colors.amber, dot: colors.amber },
  acknowledged: { bg: colors.amberSoft, fg: colors.amber, dot: colors.amber },
  pending: { bg: colors.amberSoft, fg: colors.amber, dot: colors.amber },
  live: { bg: colors.redSoft, fg: colors.red, dot: colors.red },
  operational: { bg: colors.greenSoft, fg: colors.green, dot: colors.green },
  stored: { bg: colors.greenSoft, fg: colors.green, dot: colors.green },
  failed: { bg: colors.redSoft, fg: colors.red, dot: colors.red },
  buffering: { bg: colors.purpleSoft, fg: colors.purple, dot: colors.purple },
  tracking: { bg: colors.purpleSoft, fg: colors.purple, dot: colors.purple },
  cropping: { bg: colors.purpleSoft, fg: colors.purple, dot: colors.purple },
  privacy: { bg: colors.purpleSoft, fg: colors.purple, dot: colors.purple },
  uploading: { bg: colors.amberSoft, fg: colors.amber, dot: colors.amber },
};

export function StatusBadge({
  kind,
  label,
  pulse,
}: {
  kind: Severity | CameraStatus | ComplaintStatus | EvidenceStatus | 'live' | 'operational';
  label?: string;
  pulse?: boolean;
}) {
  const p = palettes[kind] ?? palettes.low;
  const text =
    label ??
    severityLabel[kind] ??
    statusLabel[kind] ??
    String(kind).replace('_', ' ');
  return (
    <View style={[styles.wrap, { backgroundColor: p.bg }]}>
      <View style={[styles.dot, { backgroundColor: p.dot, opacity: pulse ? 1 : 1 }]} />
      <Text style={[styles.txt, { color: p.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  txt: {
    fontFamily: font.medium,
    fontSize: 11,
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
});

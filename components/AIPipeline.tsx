import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';
import { PipelineState } from '../lib/types';
import { pipelineLabels } from '../lib/mockData';

export function AIPipeline({
  pipeline,
  compact,
}: {
  pipeline: PipelineState;
  compact?: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {pipelineLabels.map((step, i) => {
        const done = pipeline[step.key];
        const next = pipelineLabels[i + 1];
        const nextDone = next ? pipeline[next.key] : false;
        return (
          <View key={step.key} style={styles.item}>
            <View style={[styles.chip, done ? styles.chipOn : styles.chipOff]}>
              {done ? (
                <Ionicons name="checkmark" size={12} color={colors.green} />
              ) : (
                <View style={styles.dot} />
              )}
              <Text style={[styles.label, done && styles.labelOn]}>
                {compact ? step.short : step.long}
              </Text>
            </View>
            {i < pipelineLabels.length - 1 ? (
              <View style={[styles.line, nextDone || done ? styles.lineOn : null]} />
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

export function DetectionStory({
  pipeline,
}: {
  pipeline: PipelineState;
}) {
  const steps = [
    { key: 'detection' as const, icon: 'videocam-outline' as const, t: 'Camera' },
    { key: 'detection' as const, icon: 'scan-outline' as const, t: 'Detected', k2: true },
    { key: 'privacy' as const, icon: 'eye-off-outline' as const, t: 'Privacy' },
    { key: 'duplicate' as const, icon: 'copy-outline' as const, t: 'Duplicate' },
    { key: 'location' as const, icon: 'navigate-outline' as const, t: 'GPS' },
    { key: 'authority' as const, icon: 'business-outline' as const, t: 'Authority' },
    { key: 'complaint' as const, icon: 'document-text-outline' as const, t: 'Complaint' },
    { key: 'resolution' as const, icon: 'checkmark-circle' as const, t: 'Resolved' },
  ];
  return (
    <View style={styles.story}>
      <Text style={styles.storyTitle}>Detection Story</Text>
      <Text style={styles.storySub}>Camera sees a road → AI detects → privacy protects → authority notified</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.storyRow, { paddingBottom: 22 }]}>
        {steps.map((s, i) => {
          const on = pipeline[s.key];
          return (
            <View key={`${s.t}-${i}`} style={styles.storyItem}>
              <View style={[styles.storyIcon, on ? styles.storyIconOn : null]}>
                <Ionicons name={s.icon} size={16} color={on ? colors.green : colors.secondary} />
              </View>
              <Text style={[styles.storyLabel, on && { color: colors.text }]}>{s.t}</Text>
              {i < steps.length - 1 ? <View style={[styles.storyLine, on && styles.lineOn]} /> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  item: { flexDirection: 'row', alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipOn: { backgroundColor: colors.greenSoft, borderColor: '#D5EBD9' },
  chipOff: { backgroundColor: colors.muted, borderColor: colors.border },
  label: { fontFamily: font.medium, fontSize: 11, color: colors.secondary },
  labelOn: { color: colors.green },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  line: { width: 16, height: 1, backgroundColor: colors.border, marginHorizontal: 4 },
  lineOn: { backgroundColor: colors.green },
  story: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  storyTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.text, letterSpacing: -0.2 },
  storySub: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 4, marginBottom: 14 },
  storyRow: { flexDirection: 'row', alignItems: 'flex-start' },
  storyItem: { flexDirection: 'row', alignItems: 'center' },
  storyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyIconOn: { backgroundColor: colors.greenSoft },
  storyLabel: {
    fontFamily: font.medium,
    fontSize: 10,
    color: colors.secondary,
    position: 'absolute',
    top: 36,
    width: 56,
    left: -12,
    textAlign: 'center',
  },
  storyLine: { width: 28, height: 1, backgroundColor: colors.border, marginHorizontal: 6, marginBottom: 18 },
});

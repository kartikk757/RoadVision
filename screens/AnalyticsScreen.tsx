import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, font, radius } from '../lib/theme';
import { defectDistribution, metrics, roadHealth, trend7d } from '../lib/mockData';
import { pct } from '../lib/format';
import { Screen } from '../components/layout/Screen';
import { StatCard } from '../components/ui/StatCard';
import { useApp } from '../context/AppContext';
import { evidenceAPI } from '../services/evidenceAPI';
import { formatMb } from '../lib/format';

export default function AnalyticsScreen() {
  const { user } = useApp();
  const { width } = useWindowDimensions();
  const stats = evidenceAPI.stats();
  const isWide = width >= 900;
  const max = Math.max(...trend7d.map((d) => d.defects));
  const totalHealth = roadHealth.good + roadHealth.needsRepair + roadHealth.critical;
  const distMax = Math.max(...defectDistribution.map((d) => d.count));
  const colorMap = { red: colors.red, amber: colors.amber, blue: colors.blue, purple: colors.purple };

  return (
    <Screen title="Analytics" subtitle="Road health">
      <Text style={styles.lead}>
        {user?.role === 'authority'
          ? `Health of roads in ${user.division ?? 'your region'}. Evidence is crop-only.`
          : 'A quiet picture of the network — not a wall of charts.'}
      </Text>

      <View style={[styles.metrics, isWide && { flexDirection: 'row' }]}>
        <StatCard label="Total defects" value={metrics.defectsDetected} accent={colors.purple} />
        <StatCard label="Critical" value={metrics.criticalDefects} accent={colors.red} />
        <StatCard label="Resolved" value={metrics.resolvedDefects} accent={colors.green} />
        <StatCard label="Resolution rate" value={pct(metrics.resolutionRate)} accent={colors.blue} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.k}>Road health</Text>
        <View style={styles.healthBar}>
          <View style={[styles.hSeg, { flex: roadHealth.good, backgroundColor: colors.green }]} />
          <View style={[styles.hSeg, { flex: roadHealth.needsRepair, backgroundColor: colors.amber }]} />
          <View style={[styles.hSeg, { flex: roadHealth.critical, backgroundColor: colors.red }]} />
        </View>
        <View style={styles.healthLeg}>
          <Leg c={colors.green} t={`Good · ${roadHealth.good}`} />
          <Leg c={colors.amber} t={`Needs repair · ${roadHealth.needsRepair}`} />
          <Leg c={colors.red} t={`Critical · ${roadHealth.critical}`} />
        </View>
        <Text style={styles.hint}>{totalHealth} scanned road segments this week</Text>
      </View>

      <View style={[styles.split, isWide && { flexDirection: 'row' }]}>
        <View style={[styles.panel, { flex: 1.3 }]}>
          <Text style={styles.k}>Detection trend</Text>
          <View style={styles.chart}>
            {trend7d.map((d) => (
              <View key={d.day} style={styles.col}>
                <View style={styles.bars}>
                  <View style={[styles.bar, { height: (d.defects / max) * 110, backgroundColor: colors.text }]} />
                  <View style={[styles.bar, { height: (d.resolved / max) * 110, backgroundColor: colors.green, opacity: 0.7 }]} />
                </View>
                <Text style={styles.day}>{d.day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.healthLeg}>
            <Leg c={colors.text} t="Detected" />
            <Leg c={colors.green} t="Resolved" />
          </View>
        </View>
        <View style={[styles.panel, { flex: 1 }]}>
          <Text style={styles.k}>Defect distribution</Text>
          {defectDistribution.map((d) => (
            <View key={d.type} style={styles.distRow}>
              <Text style={styles.distL}>{d.type}</Text>
              <View style={styles.distTrack}>
                <View style={[styles.distFill, { width: `${(d.count / distMax) * 100}%`, backgroundColor: colorMap[d.colorKey] }]} />
              </View>
              <Text style={styles.distN}>{d.count}</Text>
            </View>
          ))}
          <Text style={styles.hint}>Avg AI confidence {pct(metrics.avgConfidence)}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.k}>Evidence storage</Text>
        <Text style={styles.hint}>
          {stats.clips} cropped clips · {formatMb(stats.kb)} stored · 8s RAM buffer · full live stream is never archived.
        </Text>
      </View>
    </Screen>
  );
}

function Leg({ c, t }: { c: string; t: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
      <Text style={{ fontFamily: font.medium, fontSize: 12, color: colors.secondary }}>{t}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: font.regular, fontSize: 14, color: colors.secondary, marginTop: -6, marginBottom: 16 },
  metrics: { gap: 10, marginBottom: 8 },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 12,
  },
  k: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.1, color: colors.secondary, textTransform: 'uppercase', marginBottom: 14 },
  healthBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 },
  hSeg: { minWidth: 8 },
  healthLeg: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  hint: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 10 },
  split: { gap: 0 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 8 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 110 },
  bar: { width: 8, borderRadius: 3, minHeight: 4 },
  day: { fontFamily: font.medium, fontSize: 10, color: colors.secondary, marginTop: 8 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  distL: { width: 92, fontFamily: font.medium, fontSize: 12, color: colors.text },
  distTrack: { flex: 1, height: 8, backgroundColor: colors.muted, borderRadius: 4, overflow: 'hidden' },
  distFill: { height: 8, borderRadius: 4 },
  distN: { width: 22, textAlign: 'right', fontFamily: font.semibold, fontSize: 12, color: colors.text },
});

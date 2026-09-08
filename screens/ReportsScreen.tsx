import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, font, radius } from '../lib/theme';
import { RootStackParamList, EvidenceStatus } from '../lib/types';
import { Screen } from '../components/layout/Screen';
import { CroppedClip } from '../components/CroppedClip';
import { StatusBadge } from '../components/ui/StatusBadge';
import { evidenceAPI } from '../services/evidenceAPI';
import { useApp } from '../context/AppContext';
import { scopeIncidents } from '../lib/roleScope';
import { formatMb, timeAgo } from '../lib/format';
import { defectLabel } from '../lib/mockData';
import { EmptyState } from '../components/EmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'briefs' | 'evidence';

export default function ReportsScreen() {
  const nav = useNavigation<Nav>();
  const { user } = useApp();
  const [tab, setTab] = useState<Tab>(user?.role === 'authority' ? 'evidence' : 'briefs');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | EvidenceStatus>('all');
  const stats = evidenceAPI.stats();
  const regionIds = new Set(scopeIncidents(user).map((i) => i.id));
  const briefHeadline = `${Math.max(stats.clips, 0)} clips · ${Math.max(stats.failed, 0)} flagged`;
  const reports = [
    { id: 'R-204', title: 'Daily corridor brief', when: 'Today, 07:00', body: briefHeadline },
    { id: 'R-198', title: 'PWD weekly pack', when: 'Mon, 08:30', body: 'Evidence zip for Division 4. 11 unique incidents after de-dupe.' },
    { id: 'R-191', title: 'Privacy audit log', when: 'Sun, 22:10', body: 'Anonymization applied to 1,204 frames. No policy exceptions.' },
  ];

  const clips = useMemo(() => {
    return evidenceAPI
      .list()
      .filter((c) => user?.role !== 'authority' || regionIds.has(c.incidentId))
      .filter((c) => status === 'all' || c.status === status)
      .filter((c) => {
        if (!q.trim()) return true;
        const s = q.toLowerCase();
        return (
          c.id.toLowerCase().includes(s) ||
          c.incidentId.toLowerCase().includes(s) ||
          c.cameraId.toLowerCase().includes(s) ||
          c.location.road.toLowerCase().includes(s) ||
          defectLabel[c.type].toLowerCase().includes(s)
        );
      });
  }, [q, status, user, regionIds]);

  return (
    <Screen title="Reports" subtitle={user?.role === 'authority' ? 'Your evidence' : 'Exports'}>
      <Text style={styles.lead}>
        {user?.role === 'authority'
          ? 'Cropped clips attached to complaints in your region. No full camera archive exists.'
          : 'Briefs and the evidence library — only confirmed crops are stored.'}
      </Text>

      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('briefs')} style={[styles.tab, tab === 'briefs' && styles.tabOn]}>
          <Text style={[styles.tabTxt, tab === 'briefs' && styles.tabTxtOn]}>Briefs</Text>
        </Pressable>
        <Pressable onPress={() => setTab('evidence')} style={[styles.tab, tab === 'evidence' && styles.tabOn]}>
          <Text style={[styles.tabTxt, tab === 'evidence' && styles.tabTxtOn]}>Evidence footage</Text>
        </Pressable>
      </View>

      {tab === 'briefs' ? (
        reports.map((r) => (
          <Pressable key={r.id} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
            <View style={styles.icon}>
              <Ionicons name="document-outline" size={18} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.id}>{r.id} · {r.when}</Text>
              <Text style={styles.h}>{r.title}</Text>
              <Text style={styles.b}>{r.body}</Text>
            </View>
            <Ionicons name="download-outline" size={18} color={colors.secondary} />
          </Pressable>
        ))
      ) : (
        <>
          <View style={styles.stats}>
            <Stat t="Clips stored" v={String(stats.clips)} />
            <Stat t="On disk" v={formatMb(stats.kb)} />
            <Stat t="vs full stream" v={`${Math.round(stats.savingsPct * 100)}% less`} />
          </View>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search clip, incident, road, camera"
            placeholderTextColor={colors.secondary}
            style={styles.search}
            returnKeyType="search"
          />
          <View style={styles.filters}>
            {(['all', 'stored', 'privacy', 'uploading', 'failed'] as const).map((s) => (
              <Pressable key={s} onPress={() => setStatus(s)} style={[styles.chip, status === s && styles.chipOn]}>
                <Text style={[styles.chipTxt, status === s && { color: '#fff' }]}>{s === 'all' ? 'All' : s}</Text>
              </Pressable>
            ))}
          </View>
          {clips.length === 0 ? (
            <EmptyState icon="film-outline" title="No clips" body="Confirmed YOLO tracks store a cropped clip only after privacy processing." />
          ) : (
            clips.map((clip) => (
              <Pressable
                key={clip.id}
                onPress={() => nav.navigate('EvidencePlayer', { id: clip.id })}
                style={({ pressed }) => [styles.evCard, pressed && { opacity: 0.9 }]}
              >
                <CroppedClip clip={clip} compact playing={false} />
                <View style={styles.evMeta}>
                  <View style={styles.evTop}>
                    <Text style={styles.id}>{clip.id}</Text>
                    <StatusBadge kind={clip.status === 'stored' ? 'stored' : clip.status === 'failed' ? 'failed' : clip.status} />
                  </View>
                  <Text style={styles.h}>{defectLabel[clip.type]} · {clip.incidentId}</Text>
                  <Text style={styles.b}>
                    {clip.location.road} · {clip.cameraId} · {clip.durationSec.toFixed(1)}s · {clip.sizeKb ? formatMb(clip.sizeKb) : '—'}
                  </Text>
                  <Text style={styles.b}>{timeAgo(clip.capturedAt)} · {clip.privacyApplied ? 'Privacy applied' : 'Privacy pending'}</Text>
                </View>
              </Pressable>
            ))
          )}
        </>
      )}
    </Screen>
  );
}

function Stat({ t, v }: { t: string; v: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statT}>{t}</Text>
      <Text style={styles.statV}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: font.regular, fontSize: 14, color: colors.secondary, marginTop: -6, marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.muted },
  tabOn: { backgroundColor: colors.text },
  tabTxt: { fontFamily: font.medium, fontSize: 13, color: colors.secondary },
  tabTxtOn: { color: '#fff' },
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 10,
  },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  id: { fontFamily: font.medium, fontSize: 11, color: colors.secondary },
  h: { fontFamily: font.semibold, fontSize: 15, color: colors.text, marginTop: 2 },
  b: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
  },
  statT: { fontFamily: font.medium, fontSize: 10, letterSpacing: 0.6, color: colors.secondary, textTransform: 'uppercase' },
  statV: { fontFamily: font.semibold, fontSize: 16, color: colors.text, marginTop: 4, letterSpacing: -0.3 },
  search: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontFamily: font.medium,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.muted },
  chipOn: { backgroundColor: colors.text },
  chipTxt: { fontFamily: font.medium, fontSize: 12, color: colors.secondary, textTransform: 'capitalize' },
  evCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
  },
  evMeta: { padding: 14 },
  evTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';
import { RootStackParamList } from '../lib/types';
import { useApp } from '../context/AppContext';
import { fullPipeline, metrics } from '../lib/mockData';
import { formatDate, greeting, pct, timeAgo } from '../lib/format';
import { roleHomeCopy, scopeComplaints, scopeDetections, scopeIncidents } from '../lib/roleScope';
import { evidenceAPI } from '../services/evidenceAPI';
import { Screen } from '../components/layout/Screen';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AIPipeline, DetectionStory } from '../components/AIPipeline';
import { MapPreview } from '../components/MapPreview';
import { Button } from '../components/ui/Button';
import { defectLabel } from '../lib/mockData';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const nav = useNavigation<Nav>();
  const { user, monitoring, setMonitoring, cameras } = useApp();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [refreshing, setRefreshing] = useState(false);
  const scopedIncidents = useMemo(() => scopeIncidents(user), [user]);
  const scopedDetections = useMemo(() => scopeDetections(user), [user]);
  const scopedComplaints = useMemo(() => scopeComplaints(user), [user]);
  const copy = roleHomeCopy(user);
  const recent = useMemo(
    () => [...scopedDetections].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 6),
    [scopedDetections],
  );
  const online = cameras.filter((c) => c.status === 'online').length;
  const isAuthority = user?.role === 'authority';
  const isAdmin = user?.role === 'admin';
  const openRegion = scopedComplaints.filter((c) => c.status !== 'resolved').length;
  const regionCritical = scopedIncidents.filter((i) => i.severity === 'critical').length;
  const evidenceCount = evidenceAPI.list().filter((e) => scopedIncidents.some((i) => i.id === e.incidentId) && e.stored).length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <Screen
      subtitle={copy.subtitle}
      title={copy.title}
      refreshing={refreshing}
      onRefresh={onRefresh}
      right={
        <View style={{ alignItems: 'flex-end' }}>
          <StatusBadge kind="operational" label="System Operational" />
          <Text style={styles.date}>{formatDate()}</Text>
        </View>
      }
    >
      <Text style={styles.hello}>
        {greeting()}, {user?.name.split(' ')[0] ?? 'there'}
      </Text>
      <Text style={styles.lead}>{copy.lead}</Text>

      {user?.role === 'conductor' ? (
        <View style={styles.heroAction}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroK}>Conductor control</Text>
            <Text style={styles.heroT}>{monitoring ? 'Monitoring is live' : 'AI is standing by'}</Text>
            <Text style={styles.heroP}>
              {monitoring
                ? 'Detections, privacy and complaints run automatically.'
                : 'Start monitoring to stream camera frames into the pipeline.'}
            </Text>
          </View>
          <Button
            title={monitoring ? 'Stop monitoring' : 'Start monitoring'}
            variant={monitoring ? 'danger' : 'success'}
            icon={monitoring ? 'stop' : 'play'}
            onPress={() => setMonitoring(!monitoring)}
          />
        </View>
      ) : null}

      {isAuthority ? (
        <View style={styles.heroAction}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroK}>{user?.authority}</Text>
            <Text style={styles.heroT}>{user?.division}</Text>
            <Text style={styles.heroP}>
              {openRegion} open complaint{openRegion === 1 ? '' : 's'} in your jurisdiction. Cropped evidence is attached — full camera footage is never stored.
            </Text>
          </View>
          <Button title="Review complaints" icon="document-text-outline" onPress={() => nav.navigate('Complaints')} />
        </View>
      ) : null}

      {isAdmin ? (
        <View style={styles.heroAction}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroK}>Monitoring desk</Text>
            <Text style={styles.heroT}>{online} cameras · YOLO live</Text>
            <Text style={styles.heroP}>
              Event-based capture only. 8s RAM buffer, crop on confirmed tracks, privacy before cloud.
            </Text>
          </View>
          <Button title="Open live" icon="videocam-outline" onPress={() => nav.navigate('Live')} />
        </View>
      ) : null}

      <View style={[styles.metrics, isWide && { flexDirection: 'row' }]}>
        {isAuthority ? (
          <>
            <StatCard label="Region complaints" value={scopedComplaints.length} hint={user?.division ?? 'Assigned'} accent={colors.blue} />
            <StatCard label="Open" value={openRegion} hint="awaiting your action" accent={colors.amber} />
            <StatCard label="Critical in region" value={regionCritical} hint="priority defects" accent={colors.red} />
            <StatCard label="Evidence clips" value={evidenceCount} hint="cropped only" accent={colors.purple} />
          </>
        ) : (
          <>
            <StatCard label="Roads scanned" value={metrics.roadsScanned} hint="km equivalent today" accent={colors.blue} />
            <StatCard label="Defects detected" value={metrics.defectsDetected} hint="unique after de-dupe" accent={colors.purple} />
            <StatCard label="Critical defects" value={metrics.criticalDefects} hint="needs immediate repair" accent={colors.red} />
            <StatCard label="AI confidence" value={pct(metrics.aiConfidence)} hint="rolling average" accent={colors.green} />
          </>
        )}
      </View>

      <View style={[styles.split, isWide && { flexDirection: 'row' }]}>
        <View style={[styles.mapCol, isWide && { flex: 1.4 }]}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Live network</Text>
            <Pressable onPress={() => nav.navigate('Map')}>
              <Text style={styles.link}>Open map</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => nav.navigate('Map')} style={{ minHeight: isWide ? 360 : 240 }}>
            <MapPreview incidents={scopedIncidents} onSelect={(id) => nav.navigate('IncidentDetails', { id })} tall={isWide} />
          </Pressable>
        </View>
        <View style={[styles.feedCol, isWide && { flex: 1 }]}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{isAuthority ? 'Region detections' : 'Recent detections'}</Text>
            <Pressable onPress={() => nav.navigate(isAuthority ? 'Complaints' : 'Incidents')}>
              <Text style={styles.link}>{isAuthority ? 'All complaints' : 'All incidents'}</Text>
            </Pressable>
          </View>
          <View style={styles.feed}>
            {recent.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => nav.navigate('IncidentDetails', { id: d.incidentId })}
                style={styles.feedRow}
              >
                <View style={[styles.sev, { backgroundColor: d.severity === 'critical' ? colors.red : d.severity === 'moderate' ? colors.amber : d.severity === 'resolved' ? colors.green : colors.blue }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.feedTitle}>{defectLabel[d.type]}</Text>
                  <Text style={styles.feedMeta} numberOfLines={1}>
                    {d.location.road} · {pct(d.confidence)} · {d.cameraId}
                  </Text>
                </View>
                <Text style={styles.feedTime}>{timeAgo(d.timestamp)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.sectionTitle}>AI pipeline</Text>
        <Text style={styles.sectionSub}>Every frame follows the same path — from camera to resolution.</Text>
        <View style={{ marginTop: 12 }}>
          <AIPipeline pipeline={fullPipeline('complaint')} />
        </View>
        <View style={{ marginTop: 14 }}>
          <DetectionStory pipeline={fullPipeline('complaint')} />
        </View>
      </View>

      <View style={styles.quick}>
        {isAuthority ? (
          <>
            <Quick icon="document-text-outline" title="My complaints" sub={`${openRegion} open`} onPress={() => nav.navigate('Complaints')} />
            <Quick icon="alert-circle-outline" title="Region incidents" sub={`${scopedIncidents.length} assigned`} onPress={() => nav.navigate('Incidents')} />
            <Quick icon="film-outline" title="Evidence" sub="Cropped clips" onPress={() => nav.navigate('Reports')} />
            <Quick icon="map-outline" title="Region map" sub={user?.division ?? 'GIS'} onPress={() => nav.navigate('Map')} />
          </>
        ) : (
          <>
            <Quick icon="videocam-outline" title="Live monitor" sub={`${online} cameras online`} onPress={() => nav.navigate('Live')} />
            <Quick icon="alert-circle-outline" title="Critical" sub={`${metrics.criticalDefects} open`} onPress={() => nav.navigate('Incidents')} />
            <Quick icon="document-text-outline" title="Complaints" sub="Authority workflow" onPress={() => nav.navigate('Complaints')} />
            <Quick icon="bar-chart-outline" title="Analytics" sub="Road health" onPress={() => nav.navigate('Analytics')} />
          </>
        )}
      </View>
    </Screen>
  );
}

function Quick({ icon, title, sub, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.8 }]}>
      <Ionicons name={icon} size={18} color={colors.text} />
      <Text style={styles.quickT}>{title}</Text>
      <Text style={styles.quickS}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hello: { fontFamily: font.medium, fontSize: 15, color: colors.secondary, marginTop: -8 },
  lead: { fontFamily: font.regular, fontSize: 14, color: colors.secondary, marginTop: 4, marginBottom: 18 },
  date: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 6 },
  heroAction: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  heroK: { fontFamily: font.medium, fontSize: 11, letterSpacing: 1.2, color: colors.secondary, textTransform: 'uppercase' },
  heroT: { fontFamily: font.semibold, fontSize: 20, color: colors.text, marginTop: 4, letterSpacing: -0.4 },
  heroP: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, marginTop: 4, maxWidth: 420 },
  metrics: { gap: 10, marginBottom: 20 },
  split: { gap: 16 },
  mapCol: { minHeight: 240 },
  feedCol: {},
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontFamily: font.semibold, fontSize: 16, color: colors.text, letterSpacing: -0.3 },
  sectionSub: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, marginTop: 4 },
  link: { fontFamily: font.medium, fontSize: 13, color: colors.blue },
  feed: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sev: { width: 8, height: 8, borderRadius: 4 },
  feedTitle: { fontFamily: font.medium, fontSize: 14, color: colors.text },
  feedMeta: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 2 },
  feedTime: { fontFamily: font.medium, fontSize: 11, color: colors.secondary },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  quickCard: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
  },
  quickT: { fontFamily: font.semibold, fontSize: 14, color: colors.text, marginTop: 10 },
  quickS: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 2 },
});

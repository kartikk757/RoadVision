import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';
import { RootStackParamList } from '../lib/types';
import { defectLabel, severityLabel, statusLabel } from '../lib/mockData';
import { coord, formatTime, formatMb, pct } from '../lib/format';
import { Screen } from '../components/layout/Screen';
import { CameraFeed } from '../components/CameraFeed';
import { AIPipeline, DetectionStory } from '../components/AIPipeline';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MapPreview } from '../components/MapPreview';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/EmptyState';
import { CroppedClip } from '../components/CroppedClip';
import { evidenceAPI } from '../services/evidenceAPI';
import { fetchDetections, fetchIncidents } from '../services/backendData';
import { Detection, Incident } from '../lib/types';

type Props = NativeStackScreenProps<RootStackParamList, 'IncidentDetails'>;

export default function IncidentDetailsScreen({ route, navigation }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const [item, setItem] = useState<Incident>();
  const [det, setDet] = useState<Detection>();

  useEffect(() => {
    let active = true;
    Promise.all([fetchIncidents(), fetchDetections()]).then(([incidentRows, detectionRows]) => {
      if (!active) return;
      const incident = incidentRows.find((row) => row.id === route.params.id);
      setItem(incident);
      setDet(detectionRows.find((row) => row.incidentId === route.params.id));
    });
    return () => { active = false; };
  }, [route.params.id]);

  if (!item) {
    return (
      <Screen title="Incident">
        <EmptyState icon="alert-circle-outline" title="Not found" body="This incident is no longer available." />
      </Screen>
    );
  }
  const clips = evidenceAPI.byIncident(item.id);

  return (
    <Screen title={item.id} subtitle="Incident evidence" right={<StatusBadge kind={item.severity} />}>
      <Text style={styles.h}>{defectLabel[item.type]}</Text>
      <Text style={styles.lead}>
        {pct(item.confidence)} confidence · {severityLabel[item.severity]} · {item.location.road}
      </Text>

      <CameraFeed detection={det} fps={det?.fps ?? 24} cameraId={item.cameraId} vehicleId={item.vehicleId} live={false} />

      <View style={{ marginTop: 16 }}>
        <AIPipeline pipeline={item.pipeline} />
      </View>

      <View style={[styles.grid, isWide && { flexDirection: 'row' }]}>
        <View style={styles.panel}>
          <Text style={styles.k}>AI analysis</Text>
          <KV k="Defect type" v={defectLabel[item.type]} />
          <KV k="Confidence" v={pct(item.confidence)} />
          <KV k="Severity" v={severityLabel[item.severity]} />
          <KV k="Approx. size" v={`${item.approxSizeCm} cm`} />
        </View>
        <View style={styles.panel}>
          <Text style={styles.k}>Location</Text>
          <KV k="Road" v={item.location.road} />
          <KV k="City / state" v={`${item.location.city}, ${item.location.state}`} />
          <KV k="Latitude" v={coord(item.location.lat)} />
          <KV k="Longitude" v={coord(item.location.lng)} />
        </View>
        <View style={styles.panel}>
          <Text style={styles.k}>Source</Text>
          <KV k="Camera" v={item.cameraId} />
          <KV k="Vehicle" v={item.vehicleId} />
          <KV k="Timestamp" v={formatTime(item.timestamp)} />
          <KV k="FPS" v={`${det?.fps ?? 24}`} />
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.k}>AI verification</Text>
        <View style={styles.verRow}>
          <Ver ok={item.pipeline.detection} t="Detection" />
          <Ver ok={item.pipeline.privacy} t="Privacy" />
          <Ver ok={item.pipeline.duplicate} t="Duplicate" />
          <Ver ok={item.pipeline.location} t="Location" />
          <Ver ok={item.pipeline.complaint} t="Report" />
        </View>
      </View>

      <View style={{ height: 180, marginTop: 4 }}>
        <MapPreview incidents={[item]} selectedId={item.id} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.k}>Evidence footage</Text>
        <Text style={styles.evLead}>Cropped pothole clip only. Full live stream was discarded after the 8s RAM buffer.</Text>
        {clips.length === 0 ? (
          <Text style={styles.evLead}>No confirmed crop yet — still tracking or waiting on privacy.</Text>
        ) : (
          clips.map((clip) => (
            <View key={clip.id} style={{ marginBottom: 12 }}>
              <CroppedClip clip={clip} compact onPress={() => navigation.navigate('EvidencePlayer', { id: clip.id })} />
              <View style={{ marginTop: 8 }}>
                <KV k="Clip" v={clip.id} />
                <KV k="Duration" v={`${clip.durationSec.toFixed(1)}s · ${clip.framesUsed} frames`} />
                <KV k="Stored size" v={clip.sizeKb ? formatMb(clip.sizeKb) : 'Pending'} />
                <KV k="Privacy" v={clip.privacyApplied ? 'Applied' : 'In progress'} />
                <KV k="Track" v={clip.trackId} />
              </View>
              <Button title="Open player" variant="ghost" icon="play" onPress={() => navigation.navigate('EvidencePlayer', { id: clip.id })} style={{ marginTop: 10 }} />
            </View>
          ))
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.k}>Complaint</Text>
        <KV k="Status" v={statusLabel[item.status]} />
        <KV k="Authority" v={item.authority ?? 'Pending identification'} />
        <KV k="Division" v={item.division ?? '—'} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {item.complaintId ? (
            <Button title="View complaint" icon="document-text-outline" onPress={() => navigation.navigate('ComplaintDetails', { id: item.complaintId! })} />
          ) : null}
          <Button title="Privacy view" variant="ghost" icon="eye-off-outline" onPress={() => navigation.navigate('Privacy', { id: item.id })} />
          {item.duplicate ? (
            <Button title="Duplicate match" variant="soft" icon="copy-outline" onPress={() => navigation.navigate('Duplicate', { id: item.id })} />
          ) : null}
        </View>
      </View>

      <DetectionStory pipeline={item.pipeline} />
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
    </Screen>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kk}>{k}</Text>
      <Text style={styles.vv}>{v}</Text>
    </View>
  );
}
function Ver({ ok, t }: { ok: boolean; t: string }) {
  return (
    <View style={[styles.ver, ok ? { backgroundColor: colors.greenSoft } : { backgroundColor: colors.muted }]}>
      <Ionicons name={ok ? 'checkmark' : 'ellipse-outline'} size={12} color={ok ? colors.green : colors.secondary} />
      <Text style={[styles.verT, ok && { color: colors.green }]}>{t}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h: { fontFamily: font.semibold, fontSize: 24, letterSpacing: -0.6, color: colors.text, marginTop: -8 },
  lead: { fontFamily: font.regular, fontSize: 14, color: colors.secondary, marginTop: 4, marginBottom: 16 },
  grid: { gap: 12, marginTop: 16 },
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 12,
  },
  k: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.1, color: colors.secondary, textTransform: 'uppercase', marginBottom: 8 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  kk: { fontFamily: font.regular, fontSize: 13, color: colors.secondary },
  vv: { fontFamily: font.medium, fontSize: 13, color: colors.text, maxWidth: '60%', textAlign: 'right' },
  verRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ver: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full },
  verT: { fontFamily: font.medium, fontSize: 12, color: colors.secondary },
  notes: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, marginTop: 16, lineHeight: 20 },
  evLead: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginBottom: 12, lineHeight: 18 },
});

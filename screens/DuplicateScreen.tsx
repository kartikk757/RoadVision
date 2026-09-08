import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, font, radius } from '../lib/theme';
import { Detection, Incident, RootStackParamList } from '../lib/types';
import { defectLabel } from '../lib/mockData';
import { pct, timeAgo, coord } from '../lib/format';
import { Screen } from '../components/layout/Screen';
import { CameraFeed } from '../components/CameraFeed';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/EmptyState';
import { fetchDetections, fetchIncidents } from '../services/backendData';

type Props = NativeStackScreenProps<RootStackParamList, 'Duplicate'>;

export default function DuplicateScreen({ route, navigation }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [item, setItem] = useState<Incident>();
  const [detections, setDetections] = useState<Detection[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchIncidents(), fetchDetections()]).then(([incidentRows, detectionRows]) => {
      if (!active) return;
      setItem(incidentRows.find((incident) => incident.id === route.params.id));
      setDetections(detectionRows);
    });
    return () => { active = false; };
  }, [route.params.id]);

  const match = item?.duplicate;
  const a = detections.find((d) => d.id === match?.detectionA);
  const b = detections.find((d) => d.id === match?.detectionB);

  if (!item || !match || !a || !b) {
    return (
      <Screen title="Duplicate detection">
        <EmptyState icon="copy-outline" title="No match" body="This incident has not been compared with another camera yet." />
      </Screen>
    );
  }

  return (
    <Screen title="Duplicate Detection" subtitle="Same defect, two cameras">
      <Text style={styles.lead}>
        Nearby vehicles often see the same hole. Similarity scoring collapses repeats into one incident.
      </Text>

      <View style={[styles.pair, isWide && { flexDirection: 'row' }]}>
        <CamCard title={`${a.cameraId} · ${pct(a.confidence)}`} det={a} vehicle={a.vehicleId} />
        <CamCard title={`${b.cameraId} · ${pct(b.confidence)}`} det={b} vehicle={b.vehicleId} />
      </View>

      <View style={styles.result}>
        <Text style={styles.score}>{pct(match.similarity)}</Text>
        <Text style={styles.scoreL}>Similarity</Text>
        <View style={styles.same}>
          <Ionicons name="link" size={16} color={colors.purple} />
          <Text style={styles.sameT}>SAME INCIDENT → {item.id}</Text>
        </View>
        <Text style={styles.explain}>
          GPS within 40m · {timeAgo(a.timestamp)} vs {timeAgo(b.timestamp)} · defect class match ({defectLabel[a.type]})
        </Text>
      </View>

      <View style={styles.compare}>
        <Row k="Camera A / B" v={`${match.cameraA} / ${match.cameraB}`} />
        <Row k="GPS A" v={`${coord(a.location.lat)}, ${coord(a.location.lng)}`} />
        <Row k="GPS B" v={`${coord(b.location.lat)}, ${coord(b.location.lng)}`} />
        <Row k="Road" v={item.location.road} />
      </View>

      <Button title="Open incident" onPress={() => navigation.navigate('IncidentDetails', { id: item.id })} style={{ marginTop: 16 }} />
    </Screen>
  );
}

function CamCard({ title, det, vehicle }: { title: string; det: Detection; vehicle: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardK}>{title}</Text>
      <CameraFeed detection={det} fps={det.fps} cameraId={det.cameraId} vehicleId={vehicle} live={false} compact />
      <Text style={styles.cardM}>{defectLabel[det.type]} · {det.location.road}</Text>
    </View>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kk}>{k}</Text>
      <Text style={styles.vv}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: font.regular, fontSize: 14, color: colors.secondary, marginTop: -6, marginBottom: 16, lineHeight: 20 },
  pair: { gap: 12 },
  card: { flex: 1 },
  cardK: { fontFamily: font.semibold, fontSize: 12, color: colors.text, marginBottom: 8 },
  cardM: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 8 },
  result: {
    marginTop: 20,
    backgroundColor: colors.purpleSoft,
    borderRadius: radius.xl,
    padding: 20,
    alignItems: 'center',
  },
  score: { fontFamily: font.semibold, fontSize: 40, letterSpacing: -1.4, color: colors.purple },
  scoreL: { fontFamily: font.medium, fontSize: 12, color: colors.purple, letterSpacing: 1.4, textTransform: 'uppercase' },
  same: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  sameT: { fontFamily: font.semibold, fontSize: 13, color: colors.text, letterSpacing: 0.4 },
  explain: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 8, textAlign: 'center' },
  compare: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  kk: { fontFamily: font.regular, fontSize: 13, color: colors.secondary },
  vv: { fontFamily: font.medium, fontSize: 13, color: colors.text },
});

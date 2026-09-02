import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, font, radius } from '../lib/theme';
import { RootStackParamList } from '../lib/types';
import { evidenceAPI } from '../services/evidenceAPI';
import { Screen } from '../components/layout/Screen';
import { CroppedClip } from '../components/CroppedClip';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { coord, pct } from '../lib/format';
import { defectLabel } from '../lib/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'EvidencePlayer'>;

export default function EvidencePlayerScreen({ route, navigation }: Props) {
  const [busy, setBusy] = useState(false);
  const clip = evidenceAPI.get(route.params.id);
  if (!clip) {
    return (
      <Screen title="Evidence">
        <EmptyState icon="film-outline" title="Clip not found" body="This evidence crop is no longer available." />
      </Screen>
    );
  }
  return (
    <Screen title={clip.id} subtitle="Cropped evidence" right={<StatusBadge kind={clip.status === 'stored' ? 'resolved' : clip.status === 'failed' ? 'critical' : 'detected'} label={clip.status} />}>
      <Text style={styles.lead}>
        Only the pothole crop is stored. The live camera stream was never written to disk.
      </Text>
      <CroppedClip clip={clip} />
      <View style={styles.panel}>
        <Row k="Defect" v={defectLabel[clip.type]} />
        <Row k="Confidence" v={pct(clip.confidence)} />
        <Row k="Track" v={clip.trackId} />
        <Row k="Camera" v={`${clip.cameraId} · ${clip.vehicleId}`} />
        <Row k="Duration" v={`${clip.durationSec.toFixed(1)}s · ${clip.framesUsed} frames`} />
        <Row k="Buffer window" v={`${clip.bufferWindowSec}s RAM (discarded)`} />
        <Row k="Size" v={clip.sizeKb ? `${(clip.sizeKb / 1024).toFixed(2)} MB` : 'Not stored'} />
        <Row k="Privacy" v={clip.privacyApplied ? 'Applied before upload' : 'Pending'} />
        <Row k="GPS" v={`${coord(clip.location.lat)}, ${coord(clip.location.lng)}`} />
        <Row k="Road" v={clip.location.road} />
      </View>
      <Text style={styles.note}>{clip.note}</Text>
      {clip.failureReason ? <Text style={styles.fail}>{clip.failureReason}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        {clip.status === 'failed' ? (
          <Button
            title="Retry upload"
            icon="refresh"
            loading={busy}
            onPress={async () => {
              setBusy(true);
              await evidenceAPI.retry(clip.id);
              setBusy(false);
              navigation.replace('EvidencePlayer', { id: clip.id });
            }}
          />
        ) : null}
        <Button title="Open incident" onPress={() => navigation.navigate('IncidentDetails', { id: clip.incidentId })} />
        {clip.complaintId ? (
          <Button title="View complaint" variant="ghost" onPress={() => navigation.navigate('ComplaintDetails', { id: clip.complaintId! })} />
        ) : null}
      </View>
    </Screen>
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
  panel: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  kk: { fontFamily: font.regular, fontSize: 13, color: colors.secondary },
  vv: { fontFamily: font.medium, fontSize: 13, color: colors.text, maxWidth: '62%', textAlign: 'right' },
  note: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, marginTop: 14, lineHeight: 20 },
  fail: { fontFamily: font.medium, fontSize: 13, color: colors.red, marginTop: 8 },
});

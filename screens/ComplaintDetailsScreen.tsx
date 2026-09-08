import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, font, radius } from '../lib/theme';
import { RootStackParamList } from '../lib/types';
import { defectLabel } from '../lib/mockData';
import { Screen } from '../components/layout/Screen';
import { ComplaintTimeline } from '../components/ComplaintTimeline';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { DetectionStory } from '../components/AIPipeline';
import { EmptyState } from '../components/EmptyState';
import { CroppedClip } from '../components/CroppedClip';
import { evidenceAPI } from '../services/evidenceAPI';
import { useApp } from '../context/AppContext';
import { Complaint, Incident } from '../lib/types';
import { fetchComplaints, fetchIncidents } from '../services/backendData';

type Props = NativeStackScreenProps<RootStackParamList, 'ComplaintDetails'>;

export default function ComplaintDetailsScreen({ route, navigation }: Props) {
  const { user } = useApp();
  const [c, setComplaint] = useState<Complaint>();
  const [inc, setIncident] = useState<Incident>();

  useEffect(() => {
    let active = true;
    Promise.all([fetchComplaints(), fetchIncidents()]).then(([complaintRows, incidentRows]) => {
      if (!active) return;
      const complaint = complaintRows.find((row) => row.id === route.params.id);
      setComplaint(complaint);
      setIncident(complaint ? incidentRows.find((row) => row.id === complaint.incidentId) : undefined);
    });
    return () => { active = false; };
  }, [route.params.id]);

  const clips = c ? evidenceAPI.byComplaint(c.id) : [];
  const outOfRegion =
    user?.role === 'authority' && c && user.division && c.division !== user.division;
  if (!c || outOfRegion) {
    return (
      <Screen title="Complaint">
        <EmptyState
          icon="document-text-outline"
          title={outOfRegion ? 'Outside your region' : 'Not found'}
          body={outOfRegion ? 'This complaint is assigned to another division.' : 'This complaint could not be loaded.'}
        />
      </Screen>
    );
  }
  return (
    <Screen title={c.id} subtitle="Complaint" right={<StatusBadge kind={c.status} />}>
      <Text style={styles.h}>{c.authority}</Text>
      <Text style={styles.sub}>{c.division}</Text>
      {inc ? (
        <Text style={styles.meta}>
          {defectLabel[inc.type]} on {inc.location.road} · source {inc.cameraId}
        </Text>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.k}>Journey</Text>
        <ComplaintTimeline current={c.status} events={c.events} />
      </View>

      {clips.length ? (
        <View style={styles.panel}>
          <Text style={styles.k}>Attached evidence</Text>
          {clips.map((clip) => (
            <View key={clip.id} style={{ marginBottom: 10 }}>
              <CroppedClip clip={clip} compact onPress={() => navigation.navigate('EvidencePlayer', { id: clip.id })} />
              <Button title="Open crop" variant="ghost" onPress={() => navigation.navigate('EvidencePlayer', { id: clip.id })} style={{ marginTop: 10 }} />
            </View>
          ))}
        </View>
      ) : null}

      {inc ? <DetectionStory pipeline={inc.pipeline} /> : null}
      {c.resolutionNote ? (
        <View style={styles.note}>
          <Text style={styles.k}>Resolution note</Text>
          <Text style={styles.noteT}>{c.resolutionNote}</Text>
        </View>
      ) : null}
      {inc ? (
        <Button title="View incident" variant="ghost" onPress={() => navigation.navigate('IncidentDetails', { id: inc.id })} style={{ marginTop: 16 }} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h: { fontFamily: font.semibold, fontSize: 22, letterSpacing: -0.5, color: colors.text, marginTop: -8 },
  sub: { fontFamily: font.medium, fontSize: 14, color: colors.secondary, marginTop: 4 },
  meta: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, marginTop: 6, marginBottom: 8 },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  k: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.1, color: colors.secondary, textTransform: 'uppercase', marginBottom: 12 },
  note: { marginTop: 16, backgroundColor: colors.greenSoft, borderRadius: radius.lg, padding: 16 },
  noteT: { fontFamily: font.regular, fontSize: 13, color: colors.text, lineHeight: 20 },
});

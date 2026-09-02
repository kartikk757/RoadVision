import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, font, radius } from '../lib/theme';
import { DefectType, RootStackParamList, Severity } from '../lib/types';
import { incidents as allIncidents, defectLabel, severityLabel } from '../lib/mockData';
import { useApp } from '../context/AppContext';
import { scopeIncidents } from '../lib/roleScope';
import { pct, timeAgo } from '../lib/format';
import { Screen } from '../components/layout/Screen';
import { MapPreview } from '../components/MapPreview';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const sevs: (Severity | 'all')[] = ['all', 'critical', 'moderate', 'low', 'resolved'];
const types: (DefectType | 'all')[] = ['all', 'pothole', 'crack', 'damage', 'depression', 'marking'];

export default function RoadMapScreen() {
  const nav = useNavigation<Nav>();
  const { user } = useApp();
  const { height } = useWindowDimensions();
  const [sev, setSev] = useState<Severity | 'all'>('all');
  const [typ, setTyp] = useState<DefectType | 'all'>('all');
  const [selected, setSelected] = useState<string | undefined>();
  const region = useMemo(() => scopeIncidents(user, allIncidents), [user]);

  const data = useMemo(
    () =>
      region.filter((i) => (sev === 'all' || i.severity === sev) && (typ === 'all' || i.type === typ)),
    [sev, typ, region],
  );
  const preview = region.find((i) => i.id === selected);

  return (
    <Screen title="Road Map" subtitle="GIS intelligence" scroll={false} padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
        <Text style={styles.lead}>
          {user?.role === 'authority'
            ? `Defects in ${user.division ?? 'your region'}. Markers pulse when critical.`
            : 'Filter the live defect layer. Markers pulse when critical.'}
        </Text>
        <ScrollChips>
          {sevs.map((s) => (
            <Chip key={s} label={s === 'all' ? 'All severity' : severityLabel[s]} on={sev === s} onPress={() => setSev(s)} />
          ))}
        </ScrollChips>
        <ScrollChips>
          {types.map((t) => (
            <Chip key={t} label={t === 'all' ? 'All types' : defectLabel[t]} on={typ === t} onPress={() => setTyp(t)} />
          ))}
        </ScrollChips>
      </View>
      <View style={[styles.mapWrap, { height: Math.max(360, height * 0.55) }]}>
        <MapPreview incidents={data} selectedId={selected} onSelect={setSelected} tall />
      </View>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setSelected(undefined)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(undefined)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {preview ? (
              <>
                <View style={styles.sheetTop}>
                  <Text style={styles.id}>{preview.id}</Text>
                  <StatusBadge kind={preview.severity} />
                </View>
                <Text style={styles.title}>{defectLabel[preview.type]}</Text>
                <Text style={styles.meta}>
                  {pct(preview.confidence)} confidence · {preview.location.road}
                </Text>
                <Text style={styles.meta}>
                  {preview.location.city} · {preview.cameraId} · {timeAgo(preview.timestamp)}
                </Text>
                <View style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}>
                  <Button title="View incident" onPress={() => { setSelected(undefined); nav.navigate('IncidentDetails', { id: preview.id }); }} style={{ flex: 1 }} />
                  <Button title="Close" variant="ghost" onPress={() => setSelected(undefined)} />
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function ScrollChips({ children }: { children: React.ReactNode }) {
  return <View style={styles.chips}>{children}</View>;
}
function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipTxt, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.text, borderColor: colors.text },
  chipTxt: { fontFamily: font.medium, fontSize: 12, color: colors.secondary },
  mapWrap: { marginHorizontal: 20, marginTop: 4, marginBottom: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(17,17,17,0.28)', justifyContent: 'flex-end', padding: 16 },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.border },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontFamily: font.medium, fontSize: 12, color: colors.secondary, letterSpacing: 0.6 },
  title: { fontFamily: font.semibold, fontSize: 22, color: colors.text, marginTop: 8, letterSpacing: -0.4 },
  meta: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, marginTop: 4 },
});

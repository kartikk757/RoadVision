import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';
import { Camera } from '../lib/types';
import { useApp } from '../context/AppContext';
import { timeAgo } from '../lib/format';
import { Screen } from '../components/layout/Screen';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/EmptyState';

export default function CamerasScreen() {
  const { cameras, addCamera, updateCamera } = useApp();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState('CAM-07');
  const [vehicle, setVehicle] = useState('BUS-510');
  const [route, setRoute] = useState('NH-52');
  const [busy, setBusy] = useState<string | null>(null);
  const online = cameras.filter((c) => c.status === 'online').length;

  const sorted = useMemo(
    () => [...cameras].sort((a, b) => a.id.localeCompare(b.id)),
    [cameras],
  );

  const add = async () => {
    const cam: Camera = {
      id,
      vehicleId: vehicle,
      position: 'front',
      route,
      status: 'connecting',
      fps: 0,
      lastActive: new Date().toISOString(),
      installedAt: new Date().toISOString().slice(0, 10),
    };
    addCamera(cam);
    setOpen(false);
    setTimeout(() => updateCamera(cam.id, { status: 'online', fps: 24 }), 900);
  };

  const act = async (c: Camera, next: 'testing' | 'online' | 'connecting') => {
    setBusy(c.id);
    updateCamera(c.id, { status: next === 'online' ? 'connecting' : next });
    await new Promise((r) => setTimeout(r, 700));
    updateCamera(c.id, { status: next === 'testing' ? 'online' : 'online', fps: 24, lastActive: new Date().toISOString() });
    setBusy(null);
  };

  return (
    <Screen
      title="Cameras"
      subtitle="Fleet"
      right={<Button title="Add camera" icon="add" onPress={() => setOpen(true)} />}
    >
      <Text style={styles.lead}>{online} of {cameras.length} online · streams feed the detection pipeline</Text>
      {sorted.length === 0 ? (
        <EmptyState icon="videocam-outline" title="No cameras" body="Add a vehicle camera to begin monitoring." action="Add camera" onAction={() => setOpen(true)} />
      ) : (
        <View style={styles.list}>
          {sorted.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.top}>
                <View>
                  <Text style={styles.id}>{c.id}</Text>
                  <Text style={styles.h}>{c.vehicleId} · {c.route}</Text>
                </View>
                <StatusBadge kind={c.status} />
              </View>
              <View style={styles.meta}>
                <Meta icon="speedometer-outline" t={`${c.fps} FPS`} />
                <Meta icon="time-outline" t={timeAgo(c.lastActive)} />
                <Meta icon="camera-outline" t={c.position} />
              </View>
              <View style={styles.actions}>
                {c.status === 'offline' ? (
                  <Button title="Reconnect" variant="soft" loading={busy === c.id} onPress={() => act(c, 'connecting')} />
                ) : (
                  <Button title="Test" variant="ghost" loading={busy === c.id} onPress={() => act(c, 'testing')} />
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modal}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetH}>Add camera</Text>
            <Text style={styles.lbl}>Camera ID</Text>
            <TextInput value={id} onChangeText={setId} style={styles.input} autoCapitalize="characters" />
            <Text style={styles.lbl}>Vehicle ID</Text>
            <TextInput value={vehicle} onChangeText={setVehicle} style={styles.input} autoCapitalize="characters" />
            <Text style={styles.lbl}>Route</Text>
            <TextInput value={route} onChangeText={setRoute} style={styles.input} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Button title="Cancel" variant="ghost" onPress={() => setOpen(false)} style={{ flex: 1 }} />
              <Button title="Connect" onPress={add} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

function Meta({ icon, t }: { icon: keyof typeof Ionicons.glyphMap; t: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={13} color={colors.secondary} />
      <Text style={styles.metaT}>{t}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, marginTop: -8, marginBottom: 16 },
  list: { gap: 10 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  id: { fontFamily: font.medium, fontSize: 12, color: colors.secondary, letterSpacing: 0.5 },
  h: { fontFamily: font.semibold, fontSize: 16, color: colors.text, marginTop: 4, letterSpacing: -0.3 },
  meta: { flexDirection: 'row', gap: 14, marginTop: 12 },
  metaT: { fontFamily: font.medium, fontSize: 12, color: colors.secondary, textTransform: 'capitalize' },
  actions: { marginTop: 12, alignItems: 'flex-start' },
  modal: { flex: 1, backgroundColor: 'rgba(17,17,17,0.28)', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.border },
  sheetH: { fontFamily: font.semibold, fontSize: 18, color: colors.text, marginBottom: 8 },
  lbl: { fontFamily: font.medium, fontSize: 12, color: colors.secondary, marginTop: 10, marginBottom: 6 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontFamily: font.medium,
    color: colors.text,
    backgroundColor: colors.bg,
  },
});

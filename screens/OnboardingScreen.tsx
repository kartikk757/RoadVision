import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';
import { Camera, RootStackParamList } from '../lib/types';
import { useApp } from '../context/AppContext';
import { Screen } from '../components/layout/Screen';
import { Button } from '../components/ui/Button';
import { CameraFeed } from '../components/CameraFeed';
import { detections } from '../lib/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const steps = ['Vehicle', 'Camera', 'Connect', 'Test', 'Monitor'];

export default function OnboardingScreen(_props: Props) {
  const { completeOnboarding, setMonitoring, user } = useApp();
  const [step, setStep] = useState(0);
  const [busId, setBusId] = useState('BUS-204');
  const [route, setRoute] = useState('NH-27');
  const [camId, setCamId] = useState('CAM-01');
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [tested, setTested] = useState(false);

  const next = async () => {
    if (step === 2) {
      setBusy(true);
      await new Promise((r) => setTimeout(r, 700));
      setConnected(true);
      setBusy(false);
      setStep(3);
      return;
    }
    if (step === 3) {
      setBusy(true);
      await new Promise((r) => setTimeout(r, 800));
      setTested(true);
      setBusy(false);
      setStep(4);
      return;
    }
    if (step === 4) {
      const cam: Camera = {
        id: camId,
        vehicleId: busId,
        position: 'front',
        route,
        status: 'online',
        fps: 24,
        lastActive: new Date().toISOString(),
        installedAt: new Date().toISOString().slice(0, 10),
      };
      await completeOnboarding({ id: busId, type: 'City Bus', route }, cam);
      await setMonitoring(true);
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  return (
    <Screen title="Set up monitoring" subtitle={`Hello, ${user?.name.split(' ')[0] ?? 'Conductor'}`}>
      <View style={styles.steps}>
        {steps.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.n, i <= step && styles.nOn]}>
              <Text style={[styles.nTxt, i <= step && { color: '#fff' }]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLbl, i === step && { color: colors.text }]}>{s}</Text>
          </View>
        ))}
      </View>

      {step === 0 && (
        <View style={styles.card}>
          <Text style={styles.h}>Add vehicle</Text>
          <Text style={styles.p}>The bus or municipal vehicle carrying the camera.</Text>
          <Text style={styles.lbl}>Vehicle ID</Text>
          <TextInput value={busId} onChangeText={setBusId} style={styles.input} autoCapitalize="characters" />
          <Text style={styles.lbl}>Route / corridor</Text>
          <TextInput value={route} onChangeText={setRoute} style={styles.input} />
        </View>
      )}
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.h}>Add camera</Text>
          <Text style={styles.p}>Mount ID used by the detection service.</Text>
          <Text style={styles.lbl}>Camera ID</Text>
          <TextInput value={camId} onChangeText={setCamId} style={styles.input} autoCapitalize="characters" />
          <View style={styles.metaRow}>
            <Ionicons name="bus-outline" size={16} color={colors.secondary} />
            <Text style={styles.meta}>{busId} · {route} · Front</Text>
          </View>
        </View>
      )}
      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.h}>Connect camera</Text>
          <Text style={styles.p}>Establishing a secure stream from {camId} on {busId}.</Text>
          <View style={styles.statusBox}>
            <View style={[styles.dot, { backgroundColor: connected ? colors.green : colors.purple }]} />
            <Text style={styles.statusTxt}>{connected ? 'Connected' : busy ? 'Connecting…' : 'Ready to connect'}</Text>
          </View>
        </View>
      )}
      {step >= 3 && (
        <View style={styles.card}>
          <Text style={styles.h}>{step === 3 ? 'Test camera' : 'Start monitoring'}</Text>
          <Text style={styles.p}>
            {step === 3
              ? 'Confirm the feed and a sample detection before going live.'
              : 'After this, AI runs automatically. You only intervene on critical incidents.'}
          </Text>
          <CameraFeed detection={tested ? detections[0] : undefined} fps={24} cameraId={camId} vehicleId={busId} live={tested} />
          {tested ? (
            <View style={styles.ok}>
              <Ionicons name="checkmark-circle" size={16} color={colors.green} />
              <Text style={styles.okTxt}>Feed healthy · 24 FPS · detection sample received</Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.actions}>
        {step > 0 && step < 4 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} style={styles.back}>
            <Text style={styles.backTxt}>Back</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Button
          title={step === 2 ? 'Connect' : step === 3 ? 'Run test' : step === 4 ? 'Start monitoring' : 'Continue'}
          onPress={next}
          loading={busy}
          icon={step === 4 ? 'play' : undefined}
          variant={step === 4 ? 'success' : 'primary'}
          style={{ minWidth: 160 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  stepItem: { alignItems: 'center', flex: 1 },
  n: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  nOn: { backgroundColor: colors.text },
  nTxt: { fontFamily: font.semibold, fontSize: 11, color: colors.secondary },
  stepLbl: { fontFamily: font.medium, fontSize: 10, color: colors.secondary, marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: 18,
  },
  h: { fontFamily: font.semibold, fontSize: 20, letterSpacing: -0.4, color: colors.text },
  p: { fontFamily: font.regular, fontSize: 14, color: colors.secondary, marginTop: 6, marginBottom: 16, lineHeight: 20 },
  lbl: { fontFamily: font.medium, fontSize: 12, color: colors.secondary, marginBottom: 6, marginTop: 8 },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  meta: { fontFamily: font.medium, fontSize: 13, color: colors.secondary },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { fontFamily: font.medium, fontSize: 14, color: colors.text },
  ok: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  okTxt: { fontFamily: font.medium, fontSize: 12, color: colors.green },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  back: { padding: 12 },
  backTxt: { fontFamily: font.medium, fontSize: 14, color: colors.secondary },
});

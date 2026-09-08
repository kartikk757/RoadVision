import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';
import { Detection, RootStackParamList } from '../lib/types';
import { useApp } from '../context/AppContext';
import { fullPipeline } from '../lib/mockData';
import { coord, pct } from '../lib/format';
import { Screen } from '../components/layout/Screen';
import { CameraFeed } from '../components/CameraFeed';
import { LiveCameraFeed } from '../components/LiveCameraFeed';
import { AIPipeline } from '../components/AIPipeline';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { defectLabel, severityLabel } from '../lib/mockData';
import { useYoloLive } from '../hooks/useYoloLive';
import { fetchDetections } from '../services/backendData';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LiveMonitorScreen() {
  const nav = useNavigation<Nav>();
  const { cameras, monitoring, setMonitoring, demoMode, user } = useApp();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const [detections, setDetections] = useState<Detection[]>([]);

  useEffect(() => {
    let active = true;
    fetchDetections().then((rows) => {
      if (active) setDetections(rows);
    });
    return () => { active = false; };
  }, []);

  const liveCams = cameras.filter((c) => c.status === 'online');
  const [camIndex, setCamIndex] = useState(0);
  const cam = liveCams[camIndex] ?? cameras[0];
  const det = useMemo(() => detections.find((d) => d.cameraId === cam?.id) ?? detections[0], [cam, detections]);
  const yolo = useYoloLive({
    enabled: monitoring && isFocused && !!cam,
    cameraId: cam?.id ?? 'CAM-01',
    vehicleId: cam?.vehicleId ?? 'BUS-204',
  });
  const liveBox = yolo.boxes[0];

  if (!cam) {
    return (
      <Screen title="Live Monitor" subtitle="Cameras">
        <Text style={{ fontFamily: font.regular, color: colors.secondary }}>No cameras available.</Text>
      </Screen>
    );
  }

  if (!det && !monitoring) {
    return (
      <Screen title="Live Monitor" subtitle="Camera / YOLO">
        <Text style={{ fontFamily: font.medium, color: colors.text }}>{cam.id} · {cam.vehicleId}</Text>
        <Text style={{ fontFamily: font.regular, color: colors.secondary, marginTop: 8 }}>
          No detections have been recorded for this camera yet.
        </Text>
        <View style={{ marginTop: 14 }}><Button title="Start live camera" variant="success" icon="play" onPress={() => setMonitoring(true)} /></View>
      </Screen>
    );
  }

  const activeBox = liveBox ?? det;
  const confLabel = activeBox ? `${(activeBox.confidence * 100).toFixed(1)}%` : '—';

  return (
    <Screen title="Live Monitor" subtitle="Camera / YOLO" scroll right={<StatusBadge kind="live" label="LIVE" pulse />}>
      <View style={styles.metaBar}>
        <Text style={styles.meta}>{cam.id} · {cam.vehicleId} · {cam.route}</Text>
        <Text style={styles.meta}>{yolo.inferFps ? `${yolo.inferFps} infer/s` : 'Waiting for camera'}</Text>
      </View>

      <View style={styles.camSwitch}>
        {liveCams.map((c, i) => (
          <Pressable key={c.id} onPress={() => setCamIndex(i)} style={[styles.chip, i === camIndex && styles.chipOn]}>
            <Text style={[styles.chipTxt, i === camIndex && { color: '#fff' }]}>{c.id}</Text>
          </Pressable>
        ))}
      </View>

      {demoMode ? (
        <View style={styles.demo}>
          <Ionicons name="sparkles-outline" size={14} color={colors.purple} />
          <Text style={styles.demoTxt}>Demo YOLO-n · sample road stream · no full footage stored</Text>
        </View>
      ) : null}

      {monitoring ? (
        <LiveCameraFeed enabled={isFocused} boxes={yolo.boxes} inferFps={yolo.inferFps} cameraId={cam.id} vehicleId={cam.vehicleId} onDetections={yolo.ingest} onError={yolo.reportError} />
      ) : (
        <CameraFeed detection={det} fps={cam.fps} cameraId={cam.id} vehicleId={cam.vehicleId} live={false} />
      )}

      {yolo.serverError ? <View style={styles.serverError}><Ionicons name="cloud-offline-outline" size={16} color={colors.red} /><Text style={styles.serverErrorTxt}>{yolo.serverError}</Text></View> : null}

      {monitoring ? (
        <View style={styles.bufferRow}>
          <View style={styles.bufferItem}>
            <Text style={styles.bufferK}>RAM buffer</Text>
            <Text style={styles.bufferV}>{yolo.bufferSec.toFixed(1)}s / 8s</Text>
          </View>
          <View style={styles.bufferItem}>
            <Text style={styles.bufferK}>YOLO infer</Text>
            <Text style={styles.bufferV}>{yolo.inferFps} fps</Text>
          </View>
          <View style={styles.bufferItem}>
            <Text style={styles.bufferK}>Tracks</Text>
            <Text style={styles.bufferV}>{yolo.tracks.length}</Text>
          </View>
          <View style={styles.bufferItem}>
            <Text style={styles.bufferK}>Capture</Text>
            <Text style={[styles.bufferV, { color: yolo.capturing ? colors.purple : colors.text }]}>
              {yolo.capturing ? 'Cropping…' : 'Idle'}
            </Text>
          </View>
        </View>
      ) : null}

      {!monitoring ? (
        <View style={styles.warn}>
          <Ionicons name="pause-circle-outline" size={18} color={colors.amber} />
          <Text style={styles.warnTxt}>Monitoring paused. Start to stream detections.</Text>
          <Button title="Start" variant="success" icon="play" onPress={() => setMonitoring(true)} />
        </View>
      ) : null}

      <View style={{ marginTop: 16 }}>
        <AIPipeline pipeline={fullPipeline('location')} compact />
      </View>

      <View style={[styles.panels, isWide && { flexDirection: 'row' }]}>
        <View style={styles.panel}>
          <Text style={styles.panelK}>Detection details</Text>
          <Row k="Defect" v={activeBox ? defectLabel[activeBox.type] : 'Waiting for a road defect'} />
          <Row k="Confidence" v={confLabel} />
          <Row k="Severity" v={det ? severityLabel[det.severity] : 'Pending confirmation'} />
          <Row k="Approx. size" v={det ? `${det.approxSizeCm} cm` : '—'} />
          {liveBox ? <Row k="Track" v={liveBox.trackId} /> : null}
          {det ? <Pressable onPress={() => nav.navigate('IncidentDetails', { id: det.incidentId })} style={styles.linkRow}>
            <Text style={styles.link}>Open incident {det.incidentId}</Text><Ionicons name="arrow-forward" size={14} color={colors.blue} />
          </Pressable> : null}
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelK}>Location</Text>
          <Row k="Road" v={det?.location.road ?? 'Waiting for a recorded detection'} />
          <Row k="City" v={det ? `${det.location.city}, ${det.location.state}` : '—'} />
          <Row k="Latitude" v={det ? coord(det.location.lat) : '—'} />
          <Row k="Longitude" v={det ? coord(det.location.lng) : '—'} />
          <Pressable onPress={() => nav.navigate('Map')} style={styles.linkRow}>
            <Text style={styles.link}>View on map</Text>
            <Ionicons name="map-outline" size={14} color={colors.blue} />
          </Pressable>
        </View>
      </View>

      {user?.role !== 'authority' && yolo.events.length ? (
        <View style={styles.notify}>
          <Text style={styles.panelK}>Evidence capture</Text>
          {yolo.events.slice(0, 4).map((e) => (
            <Pressable
              key={e.id}
              onPress={() => e.clipId && nav.navigate('EvidencePlayer', { id: e.clipId })}
              style={styles.evRow}
            >
              <View style={[styles.evDot, { backgroundColor: e.status === 'fail' ? colors.red : e.status === 'warn' ? colors.amber : colors.green }]} />
              <Text style={styles.evTxt}>{e.message}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.k}>{k}</Text>
      <Text style={styles.v}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metaBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: -8 },
  meta: { fontFamily: font.medium, fontSize: 12, color: colors.secondary },
  camSwitch: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.muted },
  chipOn: { backgroundColor: colors.text },
  chipTxt: { fontFamily: font.semibold, fontSize: 12, color: colors.secondary },
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.amberSoft,
    padding: 12,
    borderRadius: radius.md,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  warnTxt: { fontFamily: font.medium, fontSize: 13, color: colors.amber, flex: 1 },
  serverError: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, backgroundColor: '#FEF3F2', borderRadius: radius.md, padding: 12 },
  serverErrorTxt: { flex: 1, fontFamily: font.medium, fontSize: 12, color: colors.red, lineHeight: 18 },
  panels: { gap: 12, marginTop: 16 },
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  panelK: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.1, color: colors.secondary, textTransform: 'uppercase', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  k: { fontFamily: font.regular, fontSize: 13, color: colors.secondary },
  v: { fontFamily: font.medium, fontSize: 13, color: colors.text },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  link: { fontFamily: font.medium, fontSize: 13, color: colors.blue },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.purpleSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  demoTxt: { fontFamily: font.medium, fontSize: 12, color: colors.purple, flex: 1 },
  bufferRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  bufferItem: {
    flexGrow: 1,
    minWidth: 90,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
  },
  bufferK: { fontFamily: font.medium, fontSize: 10, letterSpacing: 0.6, color: colors.secondary, textTransform: 'uppercase' },
  bufferV: { fontFamily: font.semibold, fontSize: 14, color: colors.text, marginTop: 4 },
  notify: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  evRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  evDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  evTxt: { flex: 1, fontFamily: font.regular, fontSize: 12, color: colors.text, lineHeight: 18 },
});

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, font, radius } from '../lib/theme';
import { Inference, yoloAPI } from '../services/yoloAPI';
import { YoloBox } from '../lib/types';
import { DetectionBox } from './DetectionBox';

const INFERENCE_INTERVAL_MS = 1100;

export function LiveCameraFeed({ enabled, boxes, inferFps, cameraId, vehicleId, onDetections, onError }: {
  enabled: boolean;
  boxes: YoloBox[];
  inferFps: number;
  cameraId: string;
  vehicleId: string;
  onDetections: (detections: Inference[], elapsedMs: number) => void;
  onError: (error: unknown) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const camera = useRef<CameraView>(null);
  const inferencing = useRef(false);

  const capture = useCallback(async () => {
    if (!enabled || !ready || !permission?.granted || inferencing.current || !camera.current) return;
    inferencing.current = true;
    const started = Date.now();
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.3 });
      if (!picture) return;
      const detections = await yoloAPI.inferMedia(picture.uri, 'image', picture.width, picture.height);
      onDetections(detections, Date.now() - started);
    } catch (error) {
      onError(error);
    } finally {
      inferencing.current = false;
    }
  }, [enabled, onDetections, onError, permission?.granted, ready]);

  useEffect(() => {
    if (!enabled || !ready || !permission?.granted) return;
    void capture();
    const interval = setInterval(() => void capture(), INFERENCE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [capture, enabled, permission?.granted, ready]);

  if (!permission) return <View style={styles.placeholder}><Text style={styles.placeholderText}>Checking camera permission…</Text></View>;
  if (!permission.granted) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Camera permission is needed to run live YOLO detection.</Text>
        <Pressable onPress={requestPermission} style={styles.permissionButton}><Text style={styles.permissionText}>Allow camera</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap} onLayout={(event) => setSize({ w: event.nativeEvent.layout.width, h: event.nativeEvent.layout.height })}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} />
      {size.w > 0 ? boxes.map((box) => <View key={box.id} style={StyleSheet.absoluteFill} pointerEvents="none"><DetectionBox box={box.bbox} parent={size} label={box.label} /></View>) : null}
      <View style={styles.hudTop}><View style={styles.live}><View style={styles.dot} /><Text style={styles.liveText}>LIVE YOLO</Text></View><Text style={styles.meta}>{inferFps ? `${inferFps} infer/s` : 'ANALYZING'}</Text></View>
      <View style={styles.hudBottom}><Text style={styles.meta}>{cameraId}</Text><Text style={styles.meta}>{vehicleId}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.asphalt },
  placeholder: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: colors.muted, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  placeholderText: { fontFamily: font.medium, color: colors.secondary, fontSize: 13, textAlign: 'center' },
  permissionButton: { backgroundColor: colors.text, borderRadius: radius.full, paddingHorizontal: 15, paddingVertical: 9 },
  permissionText: { fontFamily: font.semibold, fontSize: 12, color: '#fff' },
  hudTop: { position: 'absolute', top: 10, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hudBottom: { position: 'absolute', bottom: 10, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.red },
  liveText: { color: '#fff', fontFamily: font.semibold, fontSize: 10, letterSpacing: 1 },
  meta: { color: '#fff', fontFamily: font.medium, fontSize: 10, letterSpacing: 0.4, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
});

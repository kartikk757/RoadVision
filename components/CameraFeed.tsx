import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, font, radius } from '../lib/theme';
import { Detection, YoloBox } from '../lib/types';
import { defectLabel } from '../lib/mockData';
import { DetectionBox } from './DetectionBox';

export function CameraFeed({
  detection,
  boxes,
  fps,
  cameraId,
  vehicleId,
  live = true,
  privacy = false,
  compact = false,
}: {
  detection?: Detection;
  boxes?: YoloBox[];
  fps: number;
  cameraId: string;
  vehicleId: string;
  live?: boolean;
  privacy?: boolean;
  compact?: boolean;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tick, setTick] = useState(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.35, { duration: 900 }), -1, true);
  }, [pulse]);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  const liveDot = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const now = new Date();
  const ts = `${now.toISOString().slice(0, 10)}  ${now.toTimeString().slice(0, 8)}`;

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.frame} onLayout={onLayout}>
        <AsphaltScene privacy={privacy} />
        {size.w > 0 && (boxes?.length ? boxes : detection ? [{
          id: detection.id,
          trackId: detection.id,
          type: detection.type,
          confidence: detection.confidence,
          bbox: detection.bbox,
          label: `${defectLabel[detection.type].toUpperCase()} · ${(detection.confidence * 100).toFixed(1)}%`,
        }] : []).map((b) => (
          <Animated.View key={b.id} entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill} pointerEvents="none">
            <DetectionBox box={b.bbox} parent={size} label={b.label} />
          </Animated.View>
        ))}
        {privacy ? (
          <>
            <View style={[styles.plate, { left: '12%', top: '28%' }]} />
            <View style={[styles.face, { left: '72%', top: '22%' }]} />
          </>
        ) : null}
        <View style={styles.hudTop}>
          <View style={styles.liveRow}>
            {live ? <Animated.View style={[styles.liveDot, liveDot]} /> : <View style={[styles.liveDot, { backgroundColor: colors.secondary }]} />}
            <Text style={styles.liveTxt}>{live ? 'LIVE' : 'REC'}</Text>
          </View>
          <Text style={styles.hudMono}>{fps} FPS · {cameraId}</Text>
        </View>
        <View style={styles.hudBottom}>
          <Text style={styles.hudMono}>{ts}</Text>
          <Text style={styles.hudMono}>{vehicleId} · {tick}s</Text>
        </View>
      </View>
    </View>
  );
}

function AsphaltScene({ privacy }: { privacy: boolean }) {
  return (
    <View style={styles.asphalt}>
      <View style={styles.sky} />
      <View style={styles.horizon} />
      <View style={styles.road}>
        <View style={styles.lane} />
        <View style={[styles.laneDash, { top: '18%' }]} />
        <View style={[styles.laneDash, { top: '38%' }]} />
        <View style={[styles.laneDash, { top: '58%' }]} />
        <View style={[styles.laneDash, { top: '78%' }]} />
        <View style={styles.pothole} />
        <View style={styles.potholeInner} />
        <View style={[styles.crack, { width: 80, transform: [{ rotate: '-12deg' }] }]} />
      </View>
      <View style={[styles.car, { left: '8%' }]}>
        <View style={styles.carBody} />
        {!privacy ? <View style={styles.plateRaw} /> : null}
      </View>
      <View style={[styles.person, { right: '16%' }]}>
        {!privacy ? <View style={styles.head} /> : null}
        <View style={styles.body} />
      </View>
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.asphalt },
  compact: { aspectRatio: 16 / 10 },
  frame: { flex: 1 },
  asphalt: { flex: 1, backgroundColor: '#2C2D31' },
  sky: { position: 'absolute', top: 0, left: 0, right: 0, height: '28%', backgroundColor: '#6B7A86' },
  horizon: { position: 'absolute', top: '26%', left: 0, right: 0, height: 18, backgroundColor: '#5A6460' },
  road: { position: 'absolute', top: '32%', left: 0, right: 0, bottom: 0, backgroundColor: '#3A3B40' },
  lane: {
    position: 'absolute',
    left: '48%',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'transparent',
  },
  laneDash: {
    position: 'absolute',
    left: '48%',
    width: 5,
    height: 28,
    backgroundColor: '#D8C56A',
    borderRadius: 1,
  },
  pothole: {
    position: 'absolute',
    left: '42%',
    top: '58%',
    width: 88,
    height: 52,
    borderRadius: 40,
    backgroundColor: '#1E1F22',
    transform: [{ scaleX: 1.4 }],
  },
  potholeInner: {
    position: 'absolute',
    left: '45%',
    top: '62%',
    width: 54,
    height: 28,
    borderRadius: 20,
    backgroundColor: '#151618',
  },
  crack: {
    position: 'absolute',
    left: '30%',
    top: '70%',
    height: 3,
    backgroundColor: '#1A1B1E',
    borderRadius: 2,
  },
  car: { position: 'absolute', top: '22%', width: 54, height: 28 },
  carBody: { flex: 1, backgroundColor: '#8A93A0', borderRadius: 4 },
  plateRaw: { position: 'absolute', bottom: 2, left: 8, right: 8, height: 6, backgroundColor: '#F4F1C8', borderRadius: 1 },
  person: { position: 'absolute', top: '18%', width: 16, alignItems: 'center' },
  head: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D4B39A' },
  body: { width: 14, height: 22, backgroundColor: '#3E4A62', borderRadius: 3, marginTop: 2 },
  plate: {
    position: 'absolute',
    width: 42,
    height: 12,
    backgroundColor: '#111',
    borderRadius: 2,
    opacity: 0.85,
  },
  face: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111',
    opacity: 0.7,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  hudTop: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudBottom: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.red },
  liveTxt: { color: '#fff', fontFamily: font.semibold, fontSize: 10, letterSpacing: 1.2 },
  hudMono: { color: 'rgba(255,255,255,0.86)', fontFamily: font.medium, fontSize: 10, letterSpacing: 0.4 },
});

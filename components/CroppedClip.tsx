import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, font, radius } from '../lib/theme';
import { EvidenceClip } from '../lib/types';
import { defectLabel } from '../lib/mockData';

export function CroppedClip({
  clip,
  playing = true,
  compact = false,
  onPress,
}: {
  clip: EvidenceClip;
  playing?: boolean;
  compact?: boolean;
  onPress?: () => void;
}) {
  const [play, setPlay] = useState(playing);
  const [t, setT] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => {
      setT((x) => {
        const n = x + 0.12;
        return n >= clip.durationSec ? 0 : n;
      });
    }, 120);
    return () => clearInterval(id);
  }, [play, clip.durationSec]);

  useEffect(() => {
    progress.value = withTiming(clip.durationSec ? t / clip.durationSec : 0, { duration: 100 });
  }, [t, clip.durationSec, progress]);

  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const drift = ((t / clip.durationSec) - 0.5) * 10;

  return (
    <Pressable onPress={onPress} style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.stage}>
        <View style={styles.asphalt}>
          <View style={[styles.hole, { transform: [{ translateX: drift }, { scaleX: 1.35 }] }]} />
          <View style={[styles.holeInner, { transform: [{ translateX: drift }] }]} />
          <View style={styles.grain} />
        </View>
        <View style={styles.cropFrame} />
        <View style={styles.tag}>
          <Text style={styles.tagTxt}>
            {defectLabel[clip.type].toUpperCase()} · {(clip.confidence * 100).toFixed(1)}%
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>CROPPED EVIDENCE</Text>
        </View>
        <Pressable
          onPress={() => setPlay((p) => !p)}
          style={styles.play}
          hitSlop={8}
        >
          <Ionicons name={play ? 'pause' : 'play'} size={14} color="#fff" />
        </Pressable>
        <View style={styles.scrub}>
          <Animated.View style={[styles.scrubFill, bar]} />
        </View>
        <Text style={styles.time}>
          {t.toFixed(1)}s / {clip.durationSec.toFixed(1)}s
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#1A1B1E' },
  compact: { aspectRatio: 16 / 10 },
  stage: { flex: 1 },
  asphalt: { flex: 1, backgroundColor: '#2F3035', alignItems: 'center', justifyContent: 'center' },
  hole: { width: 120, height: 70, borderRadius: 40, backgroundColor: '#141518' },
  holeInner: { position: 'absolute', width: 64, height: 34, borderRadius: 20, backgroundColor: '#0C0D0F' },
  grain: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.03)' },
  cropFrame: {
    ...StyleSheet.absoluteFill,
    borderWidth: 2,
    borderColor: 'rgba(94,224,160,0.55)',
    margin: 10,
    borderRadius: 8,
  },
  tag: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#111',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagTxt: { color: '#5EE0A0', fontFamily: font.semibold, fontSize: 10, letterSpacing: 0.4 },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeTxt: { color: 'rgba(255,255,255,0.8)', fontFamily: font.medium, fontSize: 9, letterSpacing: 1 },
  play: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrub: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scrubFill: { height: 3, backgroundColor: '#5EE0A0' },
  time: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: font.medium,
    fontSize: 10,
  },
});

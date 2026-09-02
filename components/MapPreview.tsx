import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, font, radius, severityColor } from '../lib/theme';
import { Incident, Severity } from '../lib/types';

const LAT_MIN = 22.68;
const LAT_MAX = 22.77;
const LNG_MIN = 75.80;
const LNG_MAX = 75.91;

function toXY(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
  const y = (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * 100;
  return { x: Math.min(94, Math.max(4, x)), y: Math.min(90, Math.max(8, y)) };
}

export function MapPreview({
  incidents,
  selectedId,
  onSelect,
  tall,
}: {
  incidents: Incident[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  tall?: boolean;
}) {
  return (
    <View style={[styles.map, tall && { minHeight: 420 }]}>
      <View style={styles.water} />
      <View style={[styles.roadH, { top: '22%' }]} />
      <View style={[styles.roadH, { top: '48%' }]} />
      <View style={[styles.roadH, { top: '72%', width: '80%', left: '10%' }]} />
      <View style={[styles.roadV, { left: '28%' }]} />
      <View style={[styles.roadV, { left: '52%' }]} />
      <View style={[styles.roadV, { left: '74%', height: '70%', top: '18%' }]} />
      <View style={[styles.block, { left: '8%', top: '28%', width: '16%', height: '16%' }]} />
      <View style={[styles.block, { left: '34%', top: '30%', width: '14%', height: '12%' }]} />
      <View style={[styles.block, { left: '58%', top: '54%', width: '12%', height: '14%' }]} />
      <View style={[styles.park, { left: '12%', top: '54%' }]} />
      <Text style={[styles.cityLabel, { left: '40%', top: '12%' }]}>INDORE</Text>
      <Text style={[styles.roadLabel, { left: '54%', top: '20%' }]}>NH-27</Text>
      <Text style={[styles.roadLabel, { left: '30%', top: '46%' }]}>MG ROAD</Text>
      <Text style={[styles.roadLabel, { left: '70%', top: '70%' }]}>AB ROAD</Text>
      {incidents.map((inc) => {
        const { x, y } = toXY(inc.location.lat, inc.location.lng);
        return (
          <MapMarker
            key={inc.id}
            x={x}
            y={y}
            severity={inc.severity}
            selected={selectedId === inc.id}
            onPress={() => onSelect?.(inc.id)}
          />
        );
      })}
      <View style={styles.legend}>
        {(['critical', 'moderate', 'low', 'resolved'] as Severity[]).map((s) => (
          <View key={s} style={styles.legItem}>
            <View style={[styles.legDot, { backgroundColor: severityColor[s] }]} />
            <Text style={styles.legTxt}>{s}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MapMarker({
  x,
  y,
  severity,
  selected,
  onPress,
}: {
  x: number;
  y: number;
  severity: Severity;
  selected?: boolean;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    if (severity === 'critical') {
      scale.value = withRepeat(withTiming(1.35, { duration: 900 }), -1, true);
    }
  }, [severity, scale]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: severity === 'critical' ? scale.value : 1 }],
    opacity: severity === 'critical' ? 0.35 : 0,
  }));
  return (
    <Pressable
      onPress={onPress}
      style={[styles.markerWrap, { left: `${x}%`, top: `${y}%` }]}
    >
      <Animated.View style={[styles.pulse, { backgroundColor: severityColor[severity] }, pulseStyle]} />
      <View
        style={[
          styles.marker,
          { backgroundColor: severityColor[severity] },
          selected && styles.markerSel,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  map: {
    backgroundColor: colors.mapLand,
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: 240,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  water: {
    position: 'absolute',
    right: '4%',
    top: '62%',
    width: '18%',
    height: '22%',
    backgroundColor: colors.mapWater,
    borderRadius: 40,
  },
  roadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: colors.mapRoadMajor,
  },
  roadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: colors.mapRoad,
  },
  block: {
    position: 'absolute',
    backgroundColor: '#E4E6DF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D5D8D0',
  },
  park: {
    position: 'absolute',
    width: '14%',
    height: '12%',
    backgroundColor: '#D5E3CF',
    borderRadius: 8,
  },
  cityLabel: {
    position: 'absolute',
    fontFamily: font.semibold,
    fontSize: 11,
    letterSpacing: 2,
    color: '#9AA094',
  },
  roadLabel: {
    position: 'absolute',
    fontFamily: font.medium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#8B8E84',
  },
  legend: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legDot: { width: 7, height: 7, borderRadius: 4 },
  legTxt: { fontFamily: font.medium, fontSize: 10, color: colors.secondary, textTransform: 'capitalize' },
  markerWrap: { position: 'absolute', width: 22, height: 22, marginLeft: -11, marginTop: -11, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 22, height: 22, borderRadius: 11 },
  marker: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
  markerSel: { width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
});

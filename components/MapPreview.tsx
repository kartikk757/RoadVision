import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, font, radius, severityColor } from '../lib/theme';
import { Incident, Severity } from '../lib/types';
import { CurrentLocation } from '../hooks/useCurrentLocation';

const ZOOM = 14;
const TILE_SIZE = 256;
const TILE_COUNT = 3;

function project(latitude: number, longitude: number) {
  const scale = TILE_SIZE * 2 ** ZOOM;
  const x = ((longitude + 180) / 360) * scale;
  const sin = Math.sin((latitude * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function tileUrl(x: number, y: number) {
  const limit = 2 ** ZOOM;
  const wrappedX = ((x % limit) + limit) % limit;
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${ZOOM}/${y}/${wrappedX}`;
}

export function MapPreview({
  incidents,
  selectedId,
  onSelect,
  tall,
  currentLocation,
}: {
  incidents: Incident[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  tall?: boolean;
  currentLocation?: CurrentLocation;
}) {
  const center = currentLocation
    ? project(currentLocation.latitude, currentLocation.longitude)
    : incidents[0]
      ? project(incidents[0].location.lat, incidents[0].location.lng)
      : project(20.5937, 78.9629);
  const centerTileX = Math.floor(center.x / TILE_SIZE);
  const centerTileY = Math.floor(center.y / TILE_SIZE);
  const centerTileOffsetX = center.x - centerTileX * TILE_SIZE;
  const centerTileOffsetY = center.y - centerTileY * TILE_SIZE;
  const markerPosition = (latitude: number, longitude: number) => {
    const point = project(latitude, longitude);
    const x = 50 + ((point.x - center.x) / (TILE_SIZE * 1.5)) * 50;
    const y = 50 + ((point.y - center.y) / (TILE_SIZE * 1.1)) * 50;
    return { x: Math.min(96, Math.max(4, x)), y: Math.min(92, Math.max(8, y)) };
  };

  return (
    <View style={[styles.map, tall && { minHeight: 420 }]}>
      {Array.from({ length: TILE_COUNT }, (_, row) =>
        Array.from({ length: TILE_COUNT }, (_, column) => {
          const tileX = centerTileX + column - 1;
          const tileY = centerTileY + row - 1;
          return (
            <Image
              key={`${tileX}-${tileY}`}
              source={{ uri: tileUrl(tileX, tileY) }}
              style={{
                position: 'absolute',
                width: TILE_SIZE,
                height: TILE_SIZE,
                left: '50%',
                top: '50%',
                transform: [
                  { translateX: (column - 1) * TILE_SIZE - centerTileOffsetX },
                  { translateY: (row - 1) * TILE_SIZE - centerTileOffsetY },
                ],
              }}
            />
          );
        }),
      )}
      {incidents.map((inc) => {
        const { x, y } = markerPosition(inc.location.lat, inc.location.lng);
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
      {currentLocation ? (
        <View style={[styles.locationMarker, { left: '50%', top: '50%' }]}>
          <View style={styles.locationPulse} />
          <View style={styles.locationDot} />
        </View>
      ) : null}
      <Text style={styles.attribution}>Esri, HERE, Garmin, © OpenStreetMap contributors</Text>
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
  attribution: { position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(255,255,255,0.88)', paddingHorizontal: 5, paddingVertical: 2, fontFamily: font.regular, fontSize: 9, color: colors.secondary },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legDot: { width: 7, height: 7, borderRadius: 4 },
  legTxt: { fontFamily: font.medium, fontSize: 10, color: colors.secondary, textTransform: 'capitalize' },
  markerWrap: { position: 'absolute', width: 22, height: 22, marginLeft: -11, marginTop: -11, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 22, height: 22, borderRadius: 11 },
  marker: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
  markerSel: { width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
  locationMarker: { position: 'absolute', width: 28, height: 28, marginLeft: -14, marginTop: -14, alignItems: 'center', justifyContent: 'center' },
  locationPulse: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(37, 99, 235, 0.25)' },
  locationDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2563EB', borderWidth: 3, borderColor: '#fff' },
});

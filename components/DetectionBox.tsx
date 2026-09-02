import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font } from '../lib/theme';
import { BoundingBox } from '../lib/types';

export function DetectionBox({
  box,
  parent,
  label,
}: {
  box: BoundingBox;
  parent: { w: number; h: number };
  label: string;
}) {
  const left = box.x * parent.w;
  const top = box.y * parent.h;
  const width = box.w * parent.w;
  const height = box.h * parent.h;
  return (
    <View style={[styles.box, { left, top, width, height }]} pointerEvents="none">
      <View style={styles.tl} />
      <View style={styles.tr} />
      <View style={styles.bl} />
      <View style={styles.br} />
      <View style={styles.tag}>
        <Text style={styles.tagTxt}>{label}</Text>
      </View>
    </View>
  );
}

const corner = {
  position: 'absolute' as const,
  width: 12,
  height: 12,
  borderColor: '#5EE0A0',
};

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(94,224,160,0.85)',
  },
  tl: { ...corner, top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { ...corner, top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { ...corner, bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { ...corner, bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3 },
  tag: {
    position: 'absolute',
    top: -22,
    left: 0,
    backgroundColor: '#111',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagTxt: { color: '#5EE0A0', fontFamily: font.semibold, fontSize: 10, letterSpacing: 0.4 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font } from '../lib/theme';
import { ComplaintStatus } from '../lib/types';
import { statusLabel } from '../lib/mockData';
import { timeAgo } from '../lib/format';

const ORDER: ComplaintStatus[] = [
  'detected',
  'verified',
  'authority_identified',
  'sent',
  'acknowledged',
  'pending',
  'resolved',
];

export function ComplaintTimeline({
  current,
  events,
}: {
  current: ComplaintStatus;
  events?: { status: ComplaintStatus; at: string; note: string }[];
}) {
  const idx = ORDER.indexOf(current);
  return (
    <View>
      {ORDER.map((s, i) => {
        const done = i <= idx;
        const ev = events?.find((e) => e.status === s);
        const last = i === ORDER.length - 1;
        return (
          <View key={s} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.node, done ? styles.nodeOn : styles.nodeOff]}>
                {done ? <Ionicons name="checkmark" size={10} color="#fff" /> : null}
              </View>
              {!last ? <View style={[styles.line, done && i < idx ? styles.lineOn : null]} /> : null}
            </View>
            <View style={styles.body}>
              <Text style={[styles.title, done && styles.titleOn]}>{statusLabel[s]}</Text>
              {ev ? (
                <>
                  <Text style={styles.note}>{ev.note}</Text>
                  <Text style={styles.time}>{timeAgo(ev.at)}</Text>
                </>
              ) : (
                <Text style={styles.note}>{done ? 'Complete' : 'Waiting'}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', minHeight: 56 },
  rail: { width: 22, alignItems: 'center' },
  node: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  nodeOn: { backgroundColor: colors.green },
  nodeOff: { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
  lineOn: { backgroundColor: colors.green },
  body: { flex: 1, paddingLeft: 10, paddingBottom: 16 },
  title: { fontFamily: font.medium, fontSize: 13, color: colors.secondary },
  titleOn: { color: colors.text },
  note: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 2 },
  time: { fontFamily: font.medium, fontSize: 11, color: colors.secondary, marginTop: 2 },
});

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, font, radius } from '../lib/theme';
import { RootStackParamList } from '../lib/types';
import { incidents } from '../lib/mockData';
import { Screen } from '../components/layout/Screen';
import { CameraFeed } from '../components/CameraFeed';
import { EmptyState } from '../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

export default function PrivacyScreen({ route }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const item = incidents.find((i) => i.id === route.params.id) ?? incidents[0];
  const det = item.detections[0];
  if (!det) {
    return (
      <Screen title="Privacy">
        <EmptyState icon="eye-off-outline" title="No frame" body="A source frame is required for privacy review." />
      </Screen>
    );
  }

  return (
    <Screen title="Privacy Engine" subtitle={item.id}>
      <Text style={styles.lead}>
        Faces and number plates are anonymized before an incident is shared with authorities.
      </Text>

      <View style={[styles.row, isWide && { flexDirection: 'row' }]}>
        <View style={styles.col}>
          <Text style={styles.k}>Original frame</Text>
          <CameraFeed detection={det} fps={det.fps} cameraId={item.cameraId} vehicleId={item.vehicleId} live={false} />
        </View>
        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={20} color={colors.purple} />
          <Text style={styles.arrowT}>Privacy{isWide ? '\n' : ' '}engine</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.k}>Protected frame</Text>
          <CameraFeed detection={det} fps={det.fps} cameraId={item.cameraId} vehicleId={item.vehicleId} live={false} privacy />
        </View>
      </View>

      <View style={styles.checks}>
        <Check t="Face anonymization" />
        <Check t="Number plate protection" />
        <Check t="Privacy processing" />
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={colors.secondary} />
        <Text style={styles.noteT}>
          Protected frames are what authorities receive. Retention of original frames follows the deployment policy of the operating city.
        </Text>
      </View>
    </Screen>
  );
}

function Check({ t }: { t: string }) {
  return (
    <View style={styles.check}>
      <Ionicons name="checkmark-circle" size={18} color={colors.green} />
      <Text style={styles.checkT}>{t}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: font.regular, fontSize: 14, color: colors.secondary, marginTop: -6, marginBottom: 18, lineHeight: 20 },
  row: { gap: 12, alignItems: 'stretch' },
  col: { flex: 1 },
  k: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.2, color: colors.secondary, textTransform: 'uppercase', marginBottom: 8 },
  arrow: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  arrowT: { fontFamily: font.medium, fontSize: 11, color: colors.purple, textAlign: 'center', marginTop: 4 },
  checks: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
  },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkT: { fontFamily: font.medium, fontSize: 14, color: colors.text },
  note: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
  },
  noteT: { flex: 1, fontFamily: font.regular, fontSize: 12, color: colors.secondary, lineHeight: 18 },
});

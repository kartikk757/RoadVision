import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, font, radius } from '../lib/theme';
import { RootStackParamList } from '../lib/types';
import { useApp } from '../context/AppContext';
import { roleTitle } from '../lib/format';
import { Screen } from '../components/layout/Screen';
import { StatusBadge } from '../components/ui/StatusBadge';
import { fullPipeline } from '../lib/mockData';
import { DetectionStory } from '../components/AIPipeline';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const items: { t: string; s: string; icon: keyof typeof Ionicons.glyphMap; to: keyof RootStackParamList }[] = [
  { t: 'Upload Evidence', s: 'Analyze image or video', icon: 'cloud-upload-outline', to: 'UploadEvidence' },
  { t: 'Cameras', s: 'Fleet streams', icon: 'videocam-outline', to: 'Cameras' },
  { t: 'Complaints', s: 'Authority workflow', icon: 'document-text-outline', to: 'Complaints' },
  { t: 'Analytics', s: 'Road health', icon: 'bar-chart-outline', to: 'Analytics' },
  { t: 'Reports', s: 'Daily briefs', icon: 'folder-outline', to: 'Reports' },
  { t: 'Settings', s: 'Workspace', icon: 'settings-outline', to: 'Settings' },
];

const authorityItems: typeof items = [
  { t: 'Complaints', s: 'Your region desk', icon: 'document-text-outline', to: 'Complaints' },
  { t: 'Incidents', s: 'Assigned defects', icon: 'alert-circle-outline', to: 'Incidents' },
  { t: 'Evidence footage', s: 'Cropped clips only', icon: 'film-outline', to: 'Reports' },
  { t: 'Analytics', s: 'Region health', icon: 'bar-chart-outline', to: 'Analytics' },
  { t: 'Settings', s: 'Workspace', icon: 'settings-outline', to: 'Settings' },
];

export default function MenuScreen() {
  const nav = useNavigation<Nav>();
  const { user, cameras } = useApp();
  return (
    <Screen title="Menu" subtitle="ROADVISION">
      <View style={styles.user}>
        <View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>
            {roleTitle(user?.role ?? 'conductor')}
            {user?.division ? ` · ${user.division}` : ''}
          </Text>
        </View>
        <StatusBadge kind="operational" label="Operational" />
      </View>
      {(user?.role === 'authority' ? authorityItems : items).map((it) => (
        <Pressable key={it.t} onPress={() => nav.navigate(it.to as never)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
          <View style={styles.icon}>
            <Ionicons name={it.icon} size={18} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.t}>{it.t}</Text>
            <Text style={styles.s}>{it.s}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
        </Pressable>
      ))}
      <Text style={styles.foot}>{cameras.filter((c) => c.status === 'online').length} cameras live</Text>
      <View style={{ marginTop: 20 }}>
        <DetectionStory pipeline={fullPipeline('complaint')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  user: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  name: { fontFamily: font.semibold, fontSize: 18, color: colors.text, letterSpacing: -0.3 },
  role: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  t: { fontFamily: font.semibold, fontSize: 15, color: colors.text },
  s: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 2 },
  foot: { fontFamily: font.medium, fontSize: 12, color: colors.secondary, marginTop: 16 },
});

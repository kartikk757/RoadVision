import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { colors, font, radius } from '../lib/theme';
import { useApp } from '../context/AppContext';
import { roleTitle } from '../lib/format';
import { Screen } from '../components/layout/Screen';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { evidenceAPI } from '../services/evidenceAPI';
import { formatMb } from '../lib/format';

export default function SettingsScreen() {
  const { user, monitoring, setMonitoring, logout, cameras, demoMode, setDemoMode } = useApp();
  const [alerts, setAlerts] = React.useState(true);
  const [privacy, setPrivacy] = React.useState(true);
  const stats = evidenceAPI.stats();

  return (
    <Screen title="Settings" subtitle="Workspace">
      <View style={styles.card}>
        <Text style={styles.k}>Signed in</Text>
        <Text style={styles.h}>{user?.name ?? 'Guest'}</Text>
        <Text style={styles.m}>
          {roleTitle(user?.role ?? 'conductor')} · ROADVISION
          {user?.division ? ` · ${user.division}` : ''}
        </Text>
        <View style={{ marginTop: 10 }}>
          <StatusBadge kind="operational" label="System Operational" />
        </View>
      </View>

      <View style={styles.card}>
        {user?.role !== 'authority' ? (
          <Row t="Live monitoring" s={monitoring ? 'AI pipeline active' : 'Paused'} v={monitoring} on={setMonitoring} />
        ) : null}
        <Row t="Critical alerts" s="Push when severity is critical" v={alerts} on={setAlerts} />
        <Row t="Privacy engine" s="Anonymize faces and plates before store" v={privacy} on={setPrivacy} />
        <Row t="Demo YOLO" s="Sample road stream when no camera is attached" v={demoMode} on={setDemoMode} last />
      </View>

      <View style={styles.card}>
        <Text style={styles.k}>Smart storage</Text>
        <Text style={styles.m}>
          {stats.clips} cropped clips · {formatMb(stats.kb)} on disk · 8s RAM buffer · full stream never written
        </Text>
        <Text style={[styles.m, { marginTop: 8 }]}>
          A continuous archive would be ~{stats.fullStreamWouldMb.toFixed(0)} MB/hour. Event crops use ~0.4% of that.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.k}>Fleet</Text>
        <Text style={styles.m}>{cameras.length} cameras registered</Text>
      </View>

      <Button title="Sign out" variant="ghost" onPress={logout} style={{ marginTop: 8 }} />
    </Screen>
  );
}

function Row({
  t, s, v, on, last,
}: { t: string; s: string; v: boolean; on: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rt}>{t}</Text>
        <Text style={styles.rs}>{s}</Text>
      </View>
      <Switch value={v} onValueChange={on} trackColor={{ true: colors.green, false: colors.border }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  k: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.1, color: colors.secondary, textTransform: 'uppercase' },
  h: { fontFamily: font.semibold, fontSize: 20, color: colors.text, marginTop: 8, letterSpacing: -0.4 },
  m: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rt: { fontFamily: font.medium, fontSize: 14, color: colors.text },
  rs: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 2 },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';
import { Role, RootStackParamList } from '../lib/types';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { fullPipeline } from '../lib/mockData';
import { DetectionStory } from '../components/AIPipeline';
import { authorityRegions } from '../lib/roleScope';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
// navigation is unused — RootNavigator swaps stacks after login

const roles: { key: Role; title: string; body: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'conductor', title: 'Conductor', body: 'Connect cameras, start monitoring.', icon: 'bus-outline' },
  { key: 'admin', title: 'Monitoring', body: 'Live cameras, map, analytics.', icon: 'pulse-outline' },
  { key: 'authority', title: 'Authority', body: 'Review complaints and resolve.', icon: 'shield-checkmark-outline' },
];

const defaultNames: Record<Role, string> = {
  conductor: 'Aarav Mehta',
  admin: 'Kavya Sharma',
  authority: 'Divya Patel',
};

export default function LoginScreen(_props: Props) {
  const { login } = useApp();
  const [name, setName] = useState('Aarav Mehta');
  const [role, setRole] = useState<Role>('conductor');
  const [region, setRegion] = useState(0);
  const [busy, setBusy] = useState(false);

  const pickRole = (r: Role) => {
    setRole(r);
    setName(defaultNames[r]);
  };

  const go = async () => {
    setBusy(true);
    const extra =
      role === 'authority'
        ? { authority: authorityRegions[region].authority, division: authorityRegions[region].division }
        : undefined;
    await login(name.trim() || 'Guest', role, extra);
    setBusy(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.inner}>
          <Text style={styles.brand}>ROADVISION</Text>
          <Text style={styles.kicker}>AI ROAD INTELLIGENCE</Text>
          <Text style={styles.h1}>See the road.{'\n'}Fix it faster.</Text>
          <Text style={styles.lead}>
            Cameras on buses detect defects, protect privacy, and file the right complaint — automatically.
          </Text>

          <Text style={styles.label}>Your name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={colors.secondary}
            style={styles.input}
            returnKeyType="done"
          />

          <Text style={[styles.label, { marginTop: 18 }]}>Sign in as</Text>
          <View style={styles.roles}>
            {roles.map((r) => {
              const on = role === r.key;
              return (
                <Pressable key={r.key} onPress={() => pickRole(r.key)} style={[styles.role, on && styles.roleOn]}>
                  <Ionicons name={r.icon} size={18} color={on ? colors.text : colors.secondary} />
                  <Text style={[styles.roleTitle, on && { color: colors.text }]}>{r.title}</Text>
                  <Text style={styles.roleBody}>{r.body}</Text>
                </Pressable>
              );
            })}
          </View>

          {role === 'authority' ? (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.label, { marginTop: 0 }]}>Responsible region</Text>
              <View style={styles.roles}>
                {authorityRegions.map((reg, i) => {
                  const on = region === i;
                  return (
                    <Pressable key={reg.division} onPress={() => setRegion(i)} style={[styles.role, on && styles.roleOn]}>
                      <Text style={[styles.roleTitle, { marginTop: 0 }, on && { color: colors.text }]}>{reg.division}</Text>
                      <Text style={styles.roleBody}>{reg.authority}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <Button title="Continue" onPress={go} loading={busy} style={{ marginTop: 22 }} />

          <View style={{ marginTop: 28 }}>
            <DetectionStory pipeline={fullPipeline('complaint')} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { padding: 24, paddingTop: 20, maxWidth: 720, width: '100%', alignSelf: 'center' },
  brand: { fontFamily: font.semibold, fontSize: 13, letterSpacing: 2.4, color: colors.text },
  kicker: { fontFamily: font.medium, fontSize: 11, letterSpacing: 1.6, color: colors.secondary, marginTop: 6 },
  h1: { fontFamily: font.semibold, fontSize: 36, letterSpacing: -1.2, color: colors.text, marginTop: 18, lineHeight: 40 },
  lead: { fontFamily: font.regular, fontSize: 15, color: colors.secondary, marginTop: 10, lineHeight: 22, maxWidth: 460 },
  label: { fontFamily: font.medium, fontSize: 12, color: colors.secondary, marginTop: 28, marginBottom: 8 },
  input: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.text,
  },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  role: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
  },
  roleOn: { borderColor: colors.text, backgroundColor: colors.muted },
  roleTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.secondary, marginTop: 10 },
  roleBody: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 4 },
});

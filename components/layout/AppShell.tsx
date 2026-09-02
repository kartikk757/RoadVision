import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../../lib/theme';
import { RootStackParamList } from '../../lib/types';
import { useApp } from '../../context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const primary = [
  { key: 'Home', label: 'Overview', icon: 'grid-outline' as const },
  { key: 'Live', label: 'Live Monitor', icon: 'videocam-outline' as const },
  { key: 'Map', label: 'Road Map', icon: 'map-outline' as const },
  { key: 'Incidents', label: 'Incidents', icon: 'alert-circle-outline' as const },
];

const secondary = [
  { key: 'Complaints', label: 'Complaints', icon: 'document-text-outline' as const },
  { key: 'Cameras', label: 'Cameras', icon: 'camera-outline' as const },
  { key: 'Analytics', label: 'Analytics', icon: 'bar-chart-outline' as const },
  { key: 'Reports', label: 'Reports', icon: 'folder-outline' as const },
  { key: 'Settings', label: 'Settings', icon: 'settings-outline' as const },
];

const mobileTabs = [
  { key: 'Home', label: 'Home', icon: 'home-outline' as const, active: 'home' as const },
  { key: 'Live', label: 'Live', icon: 'videocam-outline' as const, active: 'videocam' as const },
  { key: 'Map', label: 'Map', icon: 'map-outline' as const, active: 'map' as const },
  { key: 'Incidents', label: 'Incidents', icon: 'alert-circle-outline' as const, active: 'alert-circle' as const },
  { key: 'Menu', label: 'Menu', icon: 'menu-outline' as const, active: 'menu' as const },
];

const detailParents: Record<string, string> = {
  IncidentDetails: 'Incidents',
  Privacy: 'Incidents',
  Duplicate: 'Incidents',
  ComplaintDetails: 'Complaints',
  EvidencePlayer: 'Reports',
};

const authorityPrimary = [
  { key: 'Home', label: 'Region', icon: 'grid-outline' as const },
  { key: 'Complaints', label: 'Complaints', icon: 'document-text-outline' as const },
  { key: 'Incidents', label: 'Incidents', icon: 'alert-circle-outline' as const },
  { key: 'Map', label: 'Road Map', icon: 'map-outline' as const },
];

const authoritySecondary = [
  { key: 'Reports', label: 'Evidence', icon: 'film-outline' as const },
  { key: 'Analytics', label: 'Analytics', icon: 'bar-chart-outline' as const },
  { key: 'Settings', label: 'Settings', icon: 'settings-outline' as const },
];

const authorityTabs = [
  { key: 'Home', label: 'Home', icon: 'home-outline' as const, active: 'home' as const },
  { key: 'Complaints', label: 'Desk', icon: 'document-text-outline' as const, active: 'document-text' as const },
  { key: 'Map', label: 'Map', icon: 'map-outline' as const, active: 'map' as const },
  { key: 'Incidents', label: 'Incidents', icon: 'alert-circle-outline' as const, active: 'alert-circle' as const },
  { key: 'Menu', label: 'Menu', icon: 'menu-outline' as const, active: 'menu' as const },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1024;
  const tablet = width >= 768 && width < 1024;
  const mobile = width < 768;

  return (
    <View style={[styles.root, (desktop || tablet) && { flexDirection: 'row' }]}>
      {desktop ? <Sidebar compact={false} /> : null}
      {tablet ? <Sidebar compact /> : null}
      <View style={styles.main}>{children}</View>
      {mobile ? <BottomNav /> : null}
    </View>
  );
}

function useActive() {
  const route = useRoute();
  const name = route.name;
  return detailParents[name] ?? name;
}

function Sidebar({ compact }: { compact: boolean }) {
  const nav = useNavigation<Nav>();
  const active = useActive();
  const { user } = useApp();
  const go = (key: string) => nav.navigate(key as never);
  const isAuth = user?.role === 'authority';
  const prim = isAuth ? authorityPrimary : primary;
  const sec = isAuth ? authoritySecondary : secondary;

  return (
    <SafeAreaView edges={['left', 'top', 'bottom']} style={[styles.side, compact && styles.sideCompact]}>
      <Pressable onPress={() => go('Home')} style={styles.brandRow}>
        <View style={styles.logo}>
          <View style={styles.logoInner} />
        </View>
        {!compact ? (
          <View>
            <Text style={styles.brand}>ROADVISION</Text>
            <Text style={styles.brandSub}>{isAuth ? user?.division ?? 'Authority' : 'AI Road Intelligence'}</Text>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.navBlock}>
        {prim.map((item) => (
          <NavItem key={item.key} {...item} active={active === item.key} compact={compact} onPress={() => go(item.key)} />
        ))}
      </View>
      <View style={styles.sep} />
      <View style={styles.navBlock}>
        {sec.map((item) => (
          <NavItem key={item.key} {...item} active={active === item.key} compact={compact} onPress={() => go(item.key)} />
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <View style={[styles.status, compact && { paddingHorizontal: 8 }]}>
        <View style={styles.statusDot} />
        {!compact ? <Text style={styles.statusTxt}>System Operational</Text> : null}
      </View>
    </SafeAreaView>
  );
}

function NavItem({
  label,
  icon,
  active,
  compact,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  compact: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        compact && styles.navItemCompact,
        active && styles.navItemOn,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons name={icon} size={18} color={active ? colors.text : colors.secondary} />
      {!compact ? <Text style={[styles.navLabel, active && { color: colors.text }]}>{label}</Text> : null}
    </Pressable>
  );
}

function BottomNav() {
  const nav = useNavigation<Nav>();
  const active = useActive();
  const { user } = useApp();
  const tabs = user?.role === 'authority' ? authorityTabs : mobileTabs;
  return (
    <SafeAreaView edges={['bottom']} style={styles.bottom}>
      <View style={styles.bottomInner}>
        {tabs.map((t) => {
          const on = active === t.key || (t.key === 'Menu' && ['Cameras', 'Complaints', 'Analytics', 'Reports', 'Settings', 'Menu'].includes(active));
          return (
            <Pressable key={t.key} onPress={() => nav.navigate(t.key as never)} style={styles.tab}>
              <Ionicons name={on ? t.active : t.icon} size={22} color={on ? colors.text : colors.secondary} />
              <Text style={[styles.tabLbl, on && { color: colors.text }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  main: { flex: 1, minWidth: 0 },
  side: {
    width: 252,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  sideCompact: { width: 76, paddingHorizontal: 10, alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 16 },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7CDE9A' },
  brand: { fontFamily: font.semibold, fontSize: 13, letterSpacing: 1.6, color: colors.text },
  brandSub: { fontFamily: font.regular, fontSize: 10, color: colors.secondary, marginTop: 2 },
  navBlock: { gap: 2 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  navItemCompact: { justifyContent: 'center', paddingHorizontal: 0, width: 44 },
  navItemOn: { backgroundColor: colors.muted },
  navLabel: { fontFamily: font.medium, fontSize: 14, color: colors.secondary },
  sep: { height: 1, backgroundColor: colors.border, marginVertical: 12, marginHorizontal: 8 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  statusTxt: { fontFamily: font.medium, fontSize: 12, color: colors.green },
  bottom: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomInner: { flexDirection: 'row', paddingTop: 6, paddingHorizontal: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 6, gap: 3 },
  tabLbl: { fontFamily: font.medium, fontSize: 10, color: colors.secondary },
});

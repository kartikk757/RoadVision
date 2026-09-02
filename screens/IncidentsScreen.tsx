import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';
import { RootStackParamList, Severity } from '../lib/types';
import { incidents as seed, severityLabel } from '../lib/mockData';
import { IncidentCard } from '../components/IncidentCard';
import { EmptyState } from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { scopeIncidents } from '../lib/roleScope';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function IncidentsScreen() {
  const nav = useNavigation<Nav>();
  const { user } = useApp();
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const scoped = useMemo(() => scopeIncidents(user, seed), [user]);
  const data = useMemo(
    () =>
      [...scoped]
        .filter((i) => filter === 'all' || i.severity === filter)
        .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)),
    [filter, scoped],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        {nav.canGoBack() ? (
          <Pressable onPress={() => nav.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={16} color={colors.secondary} />
            <Text style={styles.backTxt}>Back</Text>
          </Pressable>
        ) : null}
        <Text style={styles.kicker}>{user?.role === 'authority' ? user.division ?? 'Region' : 'Evidence'}</Text>
        <Text style={styles.title}>{user?.role === 'authority' ? 'Region incidents' : 'Incidents'}</Text>
        <View style={styles.filters}>
          {(['all', 'critical', 'moderate', 'low', 'resolved'] as const).map((s) => (
            <Pressable key={s} onPress={() => setFilter(s)} style={[styles.chip, filter === s && styles.chipOn]}>
              <Text style={[styles.chipTxt, filter === s && { color: '#fff' }]}>
                {s === 'all' ? 'All' : severityLabel[s]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 10, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <IncidentCard item={item} onPress={() => nav.navigate('IncidentDetails', { id: item.id })} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState icon="search-outline" title="No incidents" body="Nothing matches this severity filter." />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: 20, paddingTop: 8 },
  kicker: { fontFamily: font.medium, fontSize: 11, letterSpacing: 1.4, color: colors.secondary, textTransform: 'uppercase' },
  title: { fontFamily: font.semibold, fontSize: 28, letterSpacing: -0.8, color: colors.text, marginTop: 4 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.muted },
  chipOn: { backgroundColor: colors.text },
  chipTxt: { fontFamily: font.medium, fontSize: 12, color: colors.secondary },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backTxt: { fontFamily: font.medium, fontSize: 13, color: colors.secondary },
});

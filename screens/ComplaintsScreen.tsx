import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';
import { RootStackParamList } from '../lib/types';
import { complaints as allComplaints, incidents, statusLabel } from '../lib/mockData';
import { timeAgo } from '../lib/format';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { scopeComplaints } from '../lib/roleScope';
import { evidenceAPI } from '../services/evidenceAPI';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ComplaintsScreen() {
  const nav = useNavigation<Nav>();
  const { user } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const complaints = scopeComplaints(user, allComplaints);
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
        <Text style={styles.kicker}>{user?.role === 'authority' ? 'Your desk' : 'Workflow'}</Text>
        <Text style={styles.title}>{user?.role === 'authority' ? 'Region complaints' : 'Complaints'}</Text>
        <Text style={styles.lead}>
          {user?.role === 'authority'
            ? `${user.division} · ${complaints.length} filed to your authority. Cropped evidence attached.`
            : 'Not a form — a detection that found its owner.'}
        </Text>
      </View>
      <FlatList
        data={complaints}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 10, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState icon="document-text-outline" title="No complaints" body="Verified incidents will appear here once an authority is identified." />}
        renderItem={({ item }) => {
          const inc = incidents.find((i) => i.id === item.incidentId);
          return (
            <Pressable
              onPress={() => nav.navigate('ComplaintDetails', { id: item.id })}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.top}>
                <Text style={styles.id}>{item.id}</Text>
                <StatusBadge kind={item.status} />
              </View>
              <Text style={styles.h}>{item.authority}</Text>
              <Text style={styles.m}>
                {item.division} · {item.incidentId}
                {evidenceAPI.byComplaint(item.id).length ? ` · ${evidenceAPI.byComplaint(item.id).length} clip` : ''}
              </Text>
              <View style={styles.bar}>
                {['detected', 'verified', 'sent', 'acknowledged', 'resolved'].map((s, i) => {
                  const order = ['detected', 'verified', 'authority_identified', 'sent', 'acknowledged', 'pending', 'resolved'];
                  const done = order.indexOf(item.status) >= order.indexOf(s === 'sent' ? 'sent' : s);
                  return <View key={s} style={[styles.seg, done && styles.segOn, i === 0 && { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }, i === 4 && { borderTopRightRadius: 3, borderBottomRightRadius: 3 }]} />;
                })}
              </View>
              <Text style={styles.time}>{statusLabel[item.status]} · {timeAgo(item.updatedAt)}{inc ? ` · ${inc.location.road}` : ''}</Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: 20, paddingTop: 8 },
  kicker: { fontFamily: font.medium, fontSize: 11, letterSpacing: 1.4, color: colors.secondary, textTransform: 'uppercase' },
  title: { fontFamily: font.semibold, fontSize: 28, letterSpacing: -0.8, color: colors.text, marginTop: 4 },
  lead: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontFamily: font.medium, fontSize: 12, color: colors.secondary, letterSpacing: 0.4 },
  h: { fontFamily: font.semibold, fontSize: 16, color: colors.text, marginTop: 8, letterSpacing: -0.3 },
  m: { fontFamily: font.regular, fontSize: 12, color: colors.secondary, marginTop: 4 },
  bar: { flexDirection: 'row', gap: 3, marginTop: 14 },
  seg: { flex: 1, height: 4, backgroundColor: colors.muted },
  segOn: { backgroundColor: colors.green },
  time: { fontFamily: font.medium, fontSize: 11, color: colors.secondary, marginTop: 10 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backTxt: { fontFamily: font.medium, fontSize: 13, color: colors.secondary },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useWindowDimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, type } from '../../lib/theme';

export function Screen({
  children,
  title,
  subtitle,
  right,
  scroll = true,
  refreshing,
  onRefresh,
  padded = true,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const navigation = useNavigation();
  const canBack = navigation.canGoBack();
  const header = title ? (
    <View style={styles.head}>
      <View style={{ flex: 1 }}>
        {canBack ? (
          <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8}>
            <Ionicons name="arrow-back" size={16} color={colors.secondary} />
            <Text style={styles.backTxt}>Back</Text>
          </Pressable>
        ) : null}
        {subtitle ? <Text style={styles.kicker}>{subtitle}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  ) : null;

  const body = (
    <View style={[padded && styles.pad, isDesktop && padded && { paddingHorizontal: 28 }]}>
      {header}
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.fill}>{body}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
        showsVerticalScrollIndicator={false}
      >
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  pad: { paddingHorizontal: 20, paddingTop: 8 },
  head: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
  kicker: {
    fontFamily: font.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.secondary,
    marginBottom: 4,
  },
  title: { ...type.display, fontSize: 28 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backTxt: { fontFamily: font.medium, fontSize: 13, color: colors.secondary },
});

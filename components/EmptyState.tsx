import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, font, radius } from '../lib/theme';
import { Button } from './ui/Button';

export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={28} color={colors.secondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action ? <Button title={action} onPress={onAction} style={{ marginTop: 16 }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState icon="warning-outline" title="Something went wrong" body={message} action="Retry" onAction={onRetry} />
  );
}

export function OfflineBanner() {
  return (
    <View style={styles.offline}>
      <Ionicons name="cloud-offline-outline" size={14} color={colors.amber} />
      <Text style={styles.offlineTxt}>Offline — showing last known detections</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontFamily: font.semibold, fontSize: 16, color: colors.text },
  body: { fontFamily: font.regular, fontSize: 13, color: colors.secondary, textAlign: 'center', marginTop: 6, maxWidth: 280 },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.amberSoft,
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  offlineTxt: { fontFamily: font.medium, fontSize: 12, color: colors.amber },
});

import type { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type KpiCardProps = {
  label: string;
  value: string;
  delta?: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
};

const toneStyle = (tone: NonNullable<KpiCardProps['tone']>) => {
  switch (tone) {
    case 'success':
      return styles.tone_success;
    case 'warning':
      return styles.tone_warning;
    case 'danger':
      return styles.tone_danger;
    default:
      return styles.tone_info;
  }
};

export const KpiCard: FC<KpiCardProps> = ({ label, value, delta, tone = 'info' }) => (
  <View style={[styles.container, toneStyle(tone)]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
    {delta ? <Text style={styles.delta}>{delta}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  delta: {
    fontSize: 12,
  },
  tone_success: {
    backgroundColor: '#E6F4EA',
  },
  tone_warning: {
    backgroundColor: '#FFF4E5',
  },
  tone_danger: {
    backgroundColor: '#FDECEA',
  },
  tone_info: {
    backgroundColor: '#E8F0FE',
  },
});

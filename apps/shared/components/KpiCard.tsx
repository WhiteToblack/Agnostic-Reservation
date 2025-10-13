import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, delta, tone = 'info' }) => {
  return (
    <View style={[styles.container, styles[`tone_${tone}`]]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {delta ? <Text style={styles.delta}>{delta}</Text> : null}
    </View>
  );
};

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

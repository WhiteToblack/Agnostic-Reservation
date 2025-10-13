import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UtilizationChartProps {
  utilization: Array<{ label: string; value: number }>;
}

export const UtilizationChart: React.FC<UtilizationChartProps> = ({ utilization }) => {
  const max = Math.max(...utilization.map((item) => item.value), 1);
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Utilization</Text>
      {utilization.map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(item.value / max) * 100}%` }]} />
          </View>
          <Text style={styles.value}>{Math.round(item.value * 100)}%</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    width: 60,
    fontSize: 12,
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  barFill: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366F1',
  },
  value: {
    fontWeight: '600',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PaymentStatus {
  provider: string;
  pending: number;
  failed: number;
}

interface PaymentsReconcileProps {
  statuses: PaymentStatus[];
}

export const PaymentsReconcile: React.FC<PaymentsReconcileProps> = ({ statuses }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payments</Text>
      {statuses.map((status) => (
        <View key={status.provider} style={styles.row}>
          <Text style={styles.provider}>{status.provider}</Text>
          <View style={styles.metrics}>
            <Text style={styles.pending}>{status.pending} pending</Text>
            <Text style={styles.failed}>{status.failed} failed</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ecfeff',
    gap: 12,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  provider: {
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    gap: 12,
  },
  pending: {
    color: '#0f172a',
  },
  failed: {
    color: '#dc2626',
  },
});

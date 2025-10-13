import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StockAlert {
  sku: string;
  name: string;
  quantity: number;
  reorderLevel: number;
}

interface StockAlertsProps {
  alerts: StockAlert[];
}

export const StockAlerts: React.FC<StockAlertsProps> = ({ alerts }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stock Alerts</Text>
      {alerts.length === 0 ? <Text style={styles.empty}>No alerts 🎉</Text> : null}
      {alerts.map((alert) => (
        <View key={alert.sku} style={styles.alert}>
          <View>
            <Text style={styles.name}>{alert.name}</Text>
            <Text style={styles.sku}>{alert.sku}</Text>
          </View>
          <Text style={styles.quantity}>
            {alert.quantity}/{alert.reorderLevel}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff7ed',
    gap: 12,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
  },
  empty: {
    fontStyle: 'italic',
  },
  alert: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontWeight: '600',
  },
  sku: {
    fontSize: 12,
    color: '#b45309',
  },
  quantity: {
    fontWeight: '700',
  },
});

import React, { useEffect, useState } from 'react';
import { ScrollView, RefreshControl, View, Text, StyleSheet } from 'react-native';
import { KpiCard, CalendarMini, QuickBook, WidgetGrid, UtilizationChart, StockAlerts, PaymentsReconcile } from '../../../../shared/components';
import { fetchDashboard, quickBook } from '../../services/api';

const DashboardScreen: React.FC = () => {
  const tenantId = 'demo-tenant';
  const roleId = 'admin-role';
  const userId = 'demo-user';
  const [refreshing, setRefreshing] = useState(false);
  const [widgets, setWidgets] = useState<any[]>([]);

  const load = async () => {
    setRefreshing(true);
    try {
      const data = await fetchDashboard(tenantId, roleId);
      setWidgets(data.widgets ?? []);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleQuickBook = async (resourceId: string) => {
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await quickBook({ tenantId, resourceId, userId, startUtc: start.toISOString(), endUtc: end.toISOString() });
    load();
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>
      <WidgetGrid>
        <KpiCard label="Utilization" value="82%" delta="▲ 5%" tone="success" />
        <KpiCard label="Revenue" value="$24.8k" delta="▲ 12%" tone="info" />
        <CalendarMini
          date={new Date()}
          items={[
            { time: '09:00', title: 'Room A - Discovery' },
            { time: '13:00', title: 'Room C - Demo' },
          ]}
        />
        <QuickBook resources={[{ id: 'room-a', name: 'Room A' }, { id: 'room-b', name: 'Room B' }, { id: 'room-c', name: 'Room C' }]} onSelect={handleQuickBook} />
        <UtilizationChart utilization={[{ label: 'Mon', value: 0.7 }, { label: 'Tue', value: 0.82 }, { label: 'Wed', value: 0.92 }]} />
        <StockAlerts alerts={[{ sku: 'KIT-01', name: 'Welcome Kits', quantity: 12, reorderLevel: 20 }]} />
        <PaymentsReconcile statuses={[{ provider: 'Stripe', pending: 2, failed: 0 }, { provider: 'Iyzico', pending: 1, failed: 1 }]} />
      </WidgetGrid>
      <View style={styles.meta}>
        <Text style={styles.metaText}>Role widgets: {widgets.length}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  meta: {
    marginTop: 24,
    alignItems: 'center',
  },
  metaText: {
    color: '#64748b',
  },
});

export default DashboardScreen;

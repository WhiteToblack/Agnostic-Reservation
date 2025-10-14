import { useEffect, useState, type FC } from 'react';
import { ScrollView, RefreshControl, View, Text, StyleSheet } from 'react-native';
import {
  KpiCard,
  CalendarMini,
  QuickBook,
  WidgetGrid,
  UtilizationChart,
  StockAlerts,
  PaymentsReconcile,
} from '../../../../shared/components';
import { fetchDashboard, quickBook, type DashboardWidget } from '../../services/api';
import { useLocalization } from '../../../../shared/localization';

const DashboardScreen: FC = () => {
  const tenantId = 'demo-tenant';
  const roleId = 'admin-role';
  const userId = 'demo-user';
  const [refreshing, setRefreshing] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const { t } = useLocalization();

  const load = async () => {
    setRefreshing(true);
    try {
      const data = await fetchDashboard(tenantId, roleId);
      setWidgets(Array.isArray(data.widgets) ? data.widgets : []);
    } catch (error) {
      console.warn('Dashboard fetch failed', error);
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
        <KpiCard label={t('dashboard.kpi.utilization', 'Utilization')} value="82%" delta="▲ 5%" tone="success" />
        <KpiCard label={t('dashboard.kpi.revenue', 'Revenue')} value="$24.8k" delta="▲ 12%" tone="info" />
        <CalendarMini
          date={new Date()}
          items={[
            {
              time: '09:00',
              title: `${t('resources.roomA', 'Room A')} - ${t('events.discovery', 'Discovery')}`,
            },
            {
              time: '13:00',
              title: `${t('resources.roomC', 'Room C')} - ${t('events.demo', 'Demo')}`,
            },
          ]}
        />
        <QuickBook
          resources={[
            { id: 'room-a', name: t('resources.roomA', 'Room A') },
            { id: 'room-b', name: t('resources.roomB', 'Room B') },
            { id: 'room-c', name: t('resources.roomC', 'Room C') },
          ]}
          onSelect={handleQuickBook}
        />
        <UtilizationChart
          utilization={[
            { label: t('dashboard.utilizationChart.day.mon', 'Mon'), value: 0.7 },
            { label: t('dashboard.utilizationChart.day.tue', 'Tue'), value: 0.82 },
            { label: t('dashboard.utilizationChart.day.wed', 'Wed'), value: 0.92 },
          ]}
        />
        <StockAlerts
          alerts={[
            {
              sku: 'KIT-01',
              name: t('inventory.item.welcomeKits', 'Welcome Kits'),
              quantity: 12,
              reorderLevel: 20,
            },
          ]}
        />
        <PaymentsReconcile statuses={[{ provider: 'Stripe', pending: 2, failed: 0 }, { provider: 'Iyzico', pending: 1, failed: 1 }]} />
      </WidgetGrid>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{t('dashboard.meta.roleWidgets', 'Role widgets: {{count}}', { count: widgets.length })}</Text>
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

import { useEffect, useMemo, useState, type FC } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  KpiCard,
  CalendarMini,
  QuickBook,
  WidgetGrid,
  UtilizationChart,
  StockAlerts,
  PaymentsReconcile,
} from '../../../../shared/components';
import {
  fetchDashboard,
  fetchDashboardInsights,
  quickBook,
  updateReservation,
  type DashboardWidget,
} from '../../services/api';
import type { DashboardInsights, TimelinePoint, UtilizationRevenueRow, RoomInsight, RoomReservationRow } from '../../../../shared/types/insights';
import { useLocalization } from '../../../../shared/localization';
import { useTheme } from '../../theme/ThemeProvider';
import { appConfig } from '../../config/appConfig';
import { loadSession } from '../../storage/sessionStorage';
import type { AuthResult } from '../../../../shared/types/auth';

const formatCurrency = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);

const formatPercent = (value: number) => `${Math.round(value)}%`;

const formatTimelineLabel = (value: string, locale: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString(locale, { month: 'short', day: '2-digit' });

const getTimelineBarWidth = (point: TimelinePoint, type: 'usage' | 'revenue', max: number) => {
  if (type === 'usage') {
    return `${Math.max(6, Math.min(100, Number(point.value)))}%`;
  }

  if (max <= 0) {
    return '6%';
  }

  return `${Math.max(6, Math.min(100, (Number(point.value) / max) * 100))}%`;
};

const resolveNextStatus = (status: string) => {
  switch (status) {
    case 'Pending':
      return { value: 'Confirmed', translationKey: 'dashboard.rooms.action.approve' };
    case 'Confirmed':
      return { value: 'Completed', translationKey: 'dashboard.rooms.action.complete' };
    case 'Completed':
      return { value: 'Confirmed', translationKey: 'dashboard.rooms.action.reopen' };
    default:
      return { value: 'Confirmed', translationKey: 'dashboard.rooms.action.activate' };
  }
};

const DashboardScreen: FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [activeInsight, setActiveInsight] = useState<'usage' | 'revenue'>('usage');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [updatingReservationId, setUpdatingReservationId] = useState<string | null>(null);
  const [session, setSession] = useState<AuthResult | null>(null);
  const { t, locale } = useLocalization();
  const { theme } = useTheme();

  useEffect(() => {
    loadSession().then((stored) => {
      if (stored) {
        setSession(stored);
      }
    });
  }, []);

  const tenantId = session?.tenantId ?? appConfig.defaultTenantId;
  const userId = session?.userId ?? '00000000-0000-0000-0000-000000000000';
  const scopedUserId = session?.userId;
  const roleId = session?.session.user?.roleId ?? '00000000-0000-0000-0000-000000000000';

  const load = async () => {
    setRefreshing(true);
    try {
      const [dashboardData, insightsData] = await Promise.all([
        fetchDashboard(tenantId, roleId),
        fetchDashboardInsights(tenantId, scopedUserId),
      ]);
      setWidgets(Array.isArray(dashboardData.widgets) ? dashboardData.widgets : []);
      setInsights(insightsData);
      if (insightsData.rooms.length > 0 && !selectedRoomId) {
        setSelectedRoomId(insightsData.rooms[0].resourceId);
      }
    } catch (error) {
      console.warn('Dashboard fetch failed', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!tenantId) {
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const handleQuickBook = async (resourceId: string) => {
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await quickBook({ tenantId, resourceId, userId, startUtc: start.toISOString(), endUtc: end.toISOString() });
    load();
  };

  const handleReservationUpdate = async (reservationId: string, status: string) => {
    setUpdatingReservationId(reservationId);
    try {
      await updateReservation({ reservationId, tenantId, status });
      await load();
    } catch (error) {
      console.warn('Reservation update failed', error);
      Alert.alert(t('dashboard.rooms.updateFailedTitle', 'Rezervasyon güncellenemedi'), t('dashboard.rooms.updateFailedBody', 'Lütfen daha sonra tekrar deneyin.'));
    } finally {
      setUpdatingReservationId(null);
    }
  };

  const activeInsightData = activeInsight === 'usage' ? insights?.usage : insights?.revenue;

  const selectedRoom: RoomInsight | undefined = useMemo(() => {
    if (!insights || insights.rooms.length === 0) {
      return undefined;
    }
    const room = insights.rooms.find((item) => item.resourceId === (selectedRoomId ?? insights.rooms[0].resourceId));
    return room ?? insights.rooms[0];
  }, [insights, selectedRoomId]);

  const timelineMax = useMemo(() => {
    if (!activeInsightData) {
      return 1;
    }
    return activeInsight === 'usage'
      ? 100
      : Math.max(...activeInsightData.timeline.map((point) => Number(point.value)), 1);
  }, [activeInsight, activeInsightData]);

  const localeValue = locale ?? 'tr-TR';

  const renderTimeline = (points: TimelinePoint[], type: 'usage' | 'revenue') => {
    if (points.length === 0) {
      return <Text style={[styles.emptyText, { color: theme.colors.muted }]}>{t('dashboard.timeline.empty', 'Gösterilecek veri bulunamadı')}</Text>;
    }

    return (
      <View style={styles.timeline}>
        {points.slice(-7).map((point) => {
          const width = getTimelineBarWidth(point, type, timelineMax);
          const valueLabel = type === 'usage' ? formatPercent(Number(point.value)) : formatCurrency(Number(point.value), localeValue);
          return (
            <View key={point.date} style={styles.timelineRow}>
              <Text style={[styles.timelineLabel, { color: theme.colors.muted }]}>{formatTimelineLabel(point.date, localeValue)}</Text>
              <View style={[styles.timelineBarBackground, { backgroundColor: theme.colors.surfaceMuted }]}>
                <View style={[styles.timelineBar, { backgroundColor: theme.colors.primary, width }]} />
              </View>
              <Text style={[styles.timelineValue, { color: theme.colors.text }]}>{valueLabel}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderBreakdown = (rows: UtilizationRevenueRow[]) => (
    <View style={[styles.table, { borderColor: theme.colors.border }]}> 
      <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: theme.colors.surfaceMuted }]}> 
        <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>{t('dashboard.breakdown.user', 'Kullanıcı')}</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>{t('dashboard.breakdown.room', 'Oda')}</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>{t('dashboard.breakdown.hours', 'Saat')}</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>{t('dashboard.breakdown.amount', 'Tutar')}</Text>
      </View>
      {rows.length === 0 ? (
        <View style={styles.tableEmpty}> 
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>{t('dashboard.breakdown.empty', 'Henüz kayıt bulunmuyor')}</Text>
        </View>
      ) : (
        rows.map((row) => (
          <View key={`${row.userId}-${row.resourceId}`} style={[styles.tableRow, { borderBottomColor: theme.colors.surfaceMuted }]}> 
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{row.userName}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{row.resourceName}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{row.hoursUsed.toFixed(1)}</Text>
            <Text style={[styles.tableCell, { color: theme.colors.text }]}>{formatCurrency(row.amountPaid, localeValue)}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderRoomReservations = (rows: RoomReservationRow[]) => (
    <View style={[styles.table, { borderColor: theme.colors.border }]}> 
      <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: theme.colors.surfaceMuted }]}> 
        <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>{t('dashboard.rooms.table.date', 'Tarih')}</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>{t('dashboard.rooms.table.user', 'Misafir')}</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>{t('dashboard.rooms.table.status', 'Durum')}</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>{t('dashboard.rooms.table.amount', 'Tutar')}</Text>
        <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>{t('dashboard.rooms.table.action', 'İşlem')}</Text>
      </View>
      {rows.length === 0 ? (
        <View style={styles.tableEmpty}> 
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>{t('dashboard.rooms.empty', 'Seçili oda için rezervasyon yok')}</Text>
        </View>
      ) : (
        rows.map((row) => {
          const action = resolveNextStatus(row.status);
          const formattedDate = `${new Date(row.startUtc).toLocaleDateString(localeValue, {
            day: '2-digit',
            month: 'short',
          })}`;
          const isUpdating = updatingReservationId === row.reservationId;
          return (
            <View key={row.reservationId} style={[styles.tableRow, { borderBottomColor: theme.colors.surfaceMuted }]}> 
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>{formattedDate}</Text>
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>{row.userName}</Text>
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>{t(`dashboard.rooms.status.${row.status.toLowerCase()}`, row.status)}</Text>
              <Text style={[styles.tableCell, { color: theme.colors.text }]}>{formatCurrency(row.amountPaid, localeValue)}</Text>
              <TouchableOpacity
                disabled={isUpdating}
                onPress={() => handleReservationUpdate(row.reservationId, action.value)}
                style={[styles.actionChip, { backgroundColor: theme.colors.primary, opacity: isUpdating ? 0.6 : 1 }]}
              >
                <Text style={styles.actionChipText}>{t(action.translationKey, 'Güncelle')}</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />}>
      <WidgetGrid>
        <KpiCard
          label={t('dashboard.kpi.utilization', 'Kullanım')}
          value="82%"
          delta="▲ 5%"
          tone="success"
        />
        <KpiCard
          label={t('dashboard.kpi.revenue', 'Gelir')}
          value={t('dashboard.kpi.revenueValue', '₺24.8B')}
          delta="▲ 12%"
          tone="info"
        />
        <CalendarMini
          date={new Date()}
          items={[
            {
              time: '09:00',
              title: `${t('resources.roomA', 'Oda A')} - ${t('events.discovery', 'Keşif')}`,
            },
            {
              time: '13:00',
              title: `${t('resources.roomC', 'Oda C')} - ${t('events.demo', 'Demo')}`,
            },
          ]}
        />
        <QuickBook
          resources={[
            { id: 'room-a', name: t('resources.roomA', 'Oda A') },
            { id: 'room-b', name: t('resources.roomB', 'Oda B') },
            { id: 'room-c', name: t('resources.roomC', 'Oda C') },
          ]}
          onSelect={handleQuickBook}
        />
        <UtilizationChart
          utilization={[
            { label: t('dashboard.utilizationChart.day.mon', 'Pzt'), value: 0.7 },
            { label: t('dashboard.utilizationChart.day.tue', 'Sal'), value: 0.82 },
            { label: t('dashboard.utilizationChart.day.wed', 'Çar'), value: 0.92 },
          ]}
        />
        <StockAlerts
          alerts={[
            {
              sku: 'KIT-01',
              name: t('inventory.item.welcomeKits', 'Karşılama kitleri'),
              quantity: 12,
              reorderLevel: 20,
            },
          ]}
        />
        <PaymentsReconcile statuses={[{ provider: 'Stripe', pending: 2, failed: 0 }, { provider: 'Iyzico', pending: 1, failed: 1 }]} />
      </WidgetGrid>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}> 
        <View style={styles.sectionHeader}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('dashboard.insights.title', 'Kullanım & gelir analizi')}</Text>
          <View style={styles.chipGroup}> 
            <TouchableOpacity
              style={[styles.chip, activeInsight === 'usage' && { backgroundColor: theme.colors.primary }]}
              onPress={() => setActiveInsight('usage')}
            >
              <Text style={[styles.chipText, { color: activeInsight === 'usage' ? '#fff' : theme.colors.text }]}>{t('dashboard.insights.usage', 'Kullanım')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, activeInsight === 'revenue' && { backgroundColor: theme.colors.primary }]}
              onPress={() => setActiveInsight('revenue')}
            >
              <Text style={[styles.chipText, { color: activeInsight === 'revenue' ? '#fff' : theme.colors.text }]}>{t('dashboard.insights.revenue', 'Gelir')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {activeInsightData && (
          <>
            {renderTimeline(activeInsightData.timeline, activeInsight)}
            {renderBreakdown(activeInsightData.breakdown)}
          </>
        )}
      </View>

      {selectedRoom && (
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('dashboard.rooms.title', 'Oda durumları')}</Text>
          <View style={styles.roomSelector}> 
            {insights?.rooms.map((room) => (
              <TouchableOpacity
                key={room.resourceId}
                style={[
                  styles.roomChip,
                  room.resourceId === selectedRoom.resourceId && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setSelectedRoomId(room.resourceId)}
              >
                <Text style={[styles.roomChipText, { color: room.resourceId === selectedRoom.resourceId ? '#fff' : theme.colors.text }]}>{room.resourceName}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {renderTimeline(selectedRoom.occupancy, 'usage')}
          {renderRoomReservations(selectedRoom.reservations)}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  chipGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  chipText: {
    fontWeight: '600',
  },
  timeline: {
    gap: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineLabel: {
    width: 60,
    fontSize: 13,
  },
  timelineBarBackground: {
    flex: 1,
    borderRadius: 12,
    height: 12,
    overflow: 'hidden',
  },
  timelineBar: {
    height: '100%',
    borderRadius: 12,
  },
  timelineValue: {
    width: 80,
    textAlign: 'right',
    fontWeight: '600',
  },
  table: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tableHeader: {
    paddingVertical: 12,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
  },
  tableEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  roomSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  roomChipText: {
    fontWeight: '600',
  },
  actionChip: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionChipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default DashboardScreen;

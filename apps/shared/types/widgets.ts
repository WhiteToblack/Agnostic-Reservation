export type WidgetType =
  | 'KPICard'
  | 'CalendarMini'
  | 'QuickBook'
  | 'UtilizationChart'
  | 'StockAlerts'
  | 'PaymentsReconcile';

export interface DashboardWidgetConfig {
  id: string;
  type: WidgetType;
  title?: string;
  payload?: Record<string, unknown>;
}

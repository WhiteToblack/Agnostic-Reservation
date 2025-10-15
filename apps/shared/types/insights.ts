export interface TimelinePoint {
  date: string;
  value: number;
}

export interface UtilizationRevenueRow {
  userId: string;
  resourceId: string;
  userName: string;
  resourceName: string;
  hoursUsed: number;
  amountPaid: number;
  reservationCount: number;
}

export interface UsageInsight {
  timeline: TimelinePoint[];
  breakdown: UtilizationRevenueRow[];
}

export interface RevenueInsight {
  timeline: TimelinePoint[];
  breakdown: UtilizationRevenueRow[];
}

export interface RoomReservationRow {
  reservationId: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  userName: string;
  startUtc: string;
  endUtc: string;
  status: string;
  amountPaid: number;
}

export interface RoomInsight {
  resourceId: string;
  resourceName: string;
  occupancy: TimelinePoint[];
  reservations: RoomReservationRow[];
}

export interface DashboardInsights {
  usage: UsageInsight;
  revenue: RevenueInsight;
  rooms: RoomInsight[];
}

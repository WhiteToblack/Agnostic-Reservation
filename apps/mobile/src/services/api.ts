import axios from 'axios';
import type { AuthResult, SessionResume } from '../../../shared/types/auth';
import type { DashboardInsights } from '../../../shared/types/insights';
import type { AdminModule } from '../../../shared/types/admin';
import { appConfig } from '../config/appConfig';

const client = axios.create({
  baseURL: appConfig.apiBaseUrl,
});

export type DashboardWidget = Record<string, unknown>;
export type DashboardResponse = {
  widgets?: DashboardWidget[];
};

export type TenantParameter = {
  id: string;
  key: string;
  value: string;
  category?: string;
  description?: string;
};

export interface SignInPayload {
  email: string;
  password: string;
  tenantId: string;
  deviceId: string;
}

export const signIn = (payload: SignInPayload) => client.post<AuthResult>('/auth/signin', payload).then((res) => res.data);

export const signUp = (payload: SignInPayload & { fullName: string; preferredTheme: string }) =>
  client
    .post<AuthResult>('/auth/signup', {
      tenantId: payload.tenantId,
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName,
      preferredTheme: payload.preferredTheme,
      deviceId: payload.deviceId,
    })
    .then((res) => res.data);

export const getSession = (tenantId: string, deviceId: string) =>
  client
    .get<SessionResume>('/auth/session', { params: { tenantId, deviceId } })
    .then((res) => res.data);

export const fetchDashboard = (tenantId: string, roleId: string) =>
  client.get<DashboardResponse>('/dashboard', { params: { tenantId, roleId } }).then((res) => res.data);

export const fetchDashboardInsights = (tenantId: string, userId?: string) =>
  client
    .get<DashboardInsights>('/dashboard/insights', { params: { tenantId, userId } })
    .then((res) => res.data);

export const fetchAvailability = (tenantId: string, resourceId: string, start: string, end: string) =>
  client.get('/reservations/availability', { params: { tenantId, resourceId, start, end } }).then((res) => res.data);

export const quickBook = (payload: { tenantId: string; resourceId: string; userId: string; startUtc: string; endUtc: string }) =>
  client.post('/reservations', payload).then((res) => res.data);

export const updateReservation = (payload: {
  reservationId: string;
  tenantId: string;
  startUtc?: string;
  endUtc?: string;
  status?: string;
}) =>
  client
    .put(`/reservations/${payload.reservationId}`, {
      tenantId: payload.tenantId,
      startUtc: payload.startUtc,
      endUtc: payload.endUtc,
      status: payload.status,
    })
    .then((res) => res.data);

export const fetchParameters = (tenantId: string) =>
  client.get<TenantParameter[]>('/admin/parameters', { params: { tenantId } }).then((res) => res.data);

export const invalidateCache = (tenantId: string) => client.post('/admin/parameters/invalidate', null, { params: { tenantId } });

export const fetchAdminModules = (tenantId: string, userId: string) =>
  client.get<AdminModule[]>('/admin/navigation', { params: { tenantId, userId } }).then((res) => res.data);

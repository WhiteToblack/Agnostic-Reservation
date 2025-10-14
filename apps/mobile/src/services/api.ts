import axios from 'axios';

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5243/api',
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
}

export const signIn = (payload: SignInPayload) => client.post('/auth/signin', payload).then((res) => res.data);

export const signUp = (payload: SignInPayload & { fullName: string; preferredTheme: string }) =>
  client
    .post('/auth/signup', {
      tenantId: payload.tenantId,
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName,
      preferredTheme: payload.preferredTheme,
    })
    .then((res) => res.data);

export const fetchDashboard = (tenantId: string, roleId: string) =>
  client.get<DashboardResponse>('/dashboard', { params: { tenantId, roleId } }).then((res) => res.data);

export const fetchAvailability = (tenantId: string, resourceId: string, start: string, end: string) =>
  client.get('/reservations/availability', { params: { tenantId, resourceId, start, end } }).then((res) => res.data);

export const quickBook = (payload: { tenantId: string; resourceId: string; userId: string; startUtc: string; endUtc: string }) =>
  client.post('/reservations', payload).then((res) => res.data);

export const fetchParameters = (tenantId: string) =>
  client.get<TenantParameter[]>('/admin/parameters', { params: { tenantId } }).then((res) => res.data);

export const invalidateCache = (tenantId: string) => client.post('/admin/parameters/invalidate', null, { params: { tenantId } });

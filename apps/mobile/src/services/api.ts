import axios from 'axios';

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5243/api'
});

const requestWithFallback = async <T>(
  action: () => Promise<T>,
  fallback: () => T,
  context: string
): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    console.warn(`Failed to ${context}. Falling back to local data.`, error);
    return fallback();
  }
};

const fallbackDashboard = () => ({ widgets: [] as any[] });
const fallbackAvailability = () => [] as any[];
const fallbackParameters = () =>
  [
    { id: 'currency', key: 'app.currency', value: 'TRY' },
    { id: 'timezone', key: 'app.timezone', value: 'Europe/Istanbul' }
  ];

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
      preferredTheme: payload.preferredTheme
    })
    .then((res) => res.data);

export const fetchDashboard = (tenantId: string, roleId: string) =>
  requestWithFallback(
    () => client.get('/dashboard', { params: { tenantId, roleId } }).then((res) => res.data),
    fallbackDashboard,
    'load dashboard data'
  );

export const fetchAvailability = (tenantId: string, resourceId: string, start: string, end: string) =>
  requestWithFallback(
    () => client.get('/reservations/availability', { params: { tenantId, resourceId, start, end } }).then((res) => res.data),
    fallbackAvailability,
    'load availability data'
  );

export const quickBook = (payload: { tenantId: string; resourceId: string; userId: string; startUtc: string; endUtc: string }) =>
  requestWithFallback(
    () => client.post('/reservations', payload).then((res) => res.data),
    () => undefined,
    'submit quick book request'
  );

export const fetchParameters = (tenantId: string) =>
  requestWithFallback(
    () => client.get('/admin/parameters', { params: { tenantId } }).then((res) => res.data),
    fallbackParameters,
    'load tenant parameters'
  );

export const invalidateCache = (tenantId: string) =>
  requestWithFallback(
    () => client.post('/admin/parameters/invalidate', null, { params: { tenantId } }).then((res) => res.data),
    () => undefined,
    'invalidate tenant cache'
  );

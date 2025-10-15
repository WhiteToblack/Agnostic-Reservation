import { defaultApiBaseUrl, normalizeApiBaseUrl } from '@shared/config/api';

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? defaultApiBaseUrl;

export const appConfig = {
  defaultTenantId: 'demo-tenant',
  apiBaseUrl: normalizeApiBaseUrl(rawApiBaseUrl),
} as const;

const ensureLeadingSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export const buildApiUrl = (path: string) => `${appConfig.apiBaseUrl}${ensureLeadingSlash(path)}`;

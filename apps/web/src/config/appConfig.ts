import { defaultApiBaseUrl, normalizeApiBaseUrl } from '@shared/config/api';

const rawApiBaseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? defaultApiBaseUrl;

export const appConfig = {
  /**
   * Default tenant identifier sourced from environment configuration.
   * Falls back to an all-zero GUID to keep the UI consistent when env is missing.
   */
  defaultTenantId:
    (import.meta.env.VITE_TENANT_ID as string | undefined) ?? '00000000-0000-0000-0000-000000000000',
  /**
   * Storage key used by the test toolbar to persist tenant overrides between reloads.
   */
  testToolbarStorageKey: 'agnosticReservation.testToolbar.tenantId',
  /**
   * Base URL for API requests. Defaults to the local development backend when not provided.
   */
  apiBaseUrl: normalizeApiBaseUrl(rawApiBaseUrl),
} as const;

const ensureLeadingSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export const buildApiUrl = (path: string) => `${appConfig.apiBaseUrl}${ensureLeadingSlash(path)}`;

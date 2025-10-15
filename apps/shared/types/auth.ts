export interface SessionUserInfo {
  id: string;
  roleId: string;
  email: string;
  fullName: string;
  preferredTheme: string;
  preferredLanguage: string;
  role: string;
  hierarchyLevel: number;
  isSuperAdmin: boolean;
  permissions: string[];
}

export interface SessionTenantInfo {
  id: string;
  name: string;
  domain?: string | null;
  defaultTheme: string;
}

export interface SessionShopInfo {
  id: string;
  name: string;
  timeZone?: string | null;
}

export interface SessionContextData {
  user?: SessionUserInfo | null;
  tenant?: SessionTenantInfo | null;
  shop?: SessionShopInfo | null;
  isTwoFactorRequired: boolean;
}

export interface AuthFeatureSettings {
  requireKvkkAcceptance: boolean;
  kvkkText?: string | null;
  requireTwoFactor: boolean;
  twoFactorProvider?: string | null;
}

export interface AuthResult {
  userId: string;
  tenantId: string;
  email: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  preferredTheme: string;
  preferredLanguage: string;
  twoFactorPending: boolean;
  features: AuthFeatureSettings;
  session: SessionContextData;
}

export interface SessionResume extends AuthResult {
  sessionId: string;
  fullName: string;
  lastActivityUtc: string;
}

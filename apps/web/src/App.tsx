import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { LocalizationProvider } from './localization/LocalizationProvider';
import { LocalizationAdmin } from './localization/LocalizationAdmin';
import { LogsAdmin } from './logs/LogsAdmin';
import { NonUserDashboard } from './components/NonUserDashboard';
import { CompanyDashboard } from './components/CompanyDashboard';
import { UserDashboard } from './components/UserDashboard';
import { TestToolbar } from './components/TestToolbar';
import { AdminSupportPanel } from './components/AdminSupportPanel';
import { appConfig } from './config/appConfig';
import {
  BillingInformation,
  ContactInformation,
  RegisteredUser,
  SupportInteraction,
} from './types/domain';
import type { AuthResult } from '../../shared/types/auth';
import {
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
  resumeSession,
  fetchUserProfile,
  updateUserProfile as apiUpdateUserProfile,
  fetchResources,
  fetchUserReservations,
  createReservation as apiCreateReservation,
  updateReservation as apiUpdateReservation,
  deleteReservation as apiDeleteReservation,
  fetchSupportTickets,
  createSupportTicket,
  type UserProfile as ApiUserProfile,
  type UserReservationsOverview,
  type ResourceDto,
  type UpdateUserProfilePayload,
  type SupportTicketDto,
} from './services/api';

type TenantOption = {
  id: string;
  name: string;
};

type Domain = 'admin' | 'company' | 'user';

type DomainOption = {
  id: Domain;
  label: string;
  host: string;
  description: string;
};

type ActiveView =
  | 'dashboard'
  | 'localization'
  | 'logs'
  | 'profile'
  | 'supportCenter'
  | 'companyOverview'
  | 'companyReservations'
  | 'companyOperations'
  | 'userHome'
  | 'userReservations'
  | 'userProfile'
  | 'userSupport';

type AuthMode = 'login' | 'signup';

const { defaultTenantId, testToolbarStorageKey } = appConfig;

const fallbackTenantId = '00000000-0000-0000-0000-000000000000';
const environmentTenantId = (import.meta.env.VITE_TENANT_ID as string | undefined) ?? fallbackTenantId;

const defaultTenantOptions: TenantOption[] = [
  { id: '92d4f35e-bc1d-4c48-9c8a-7f8c5f5a2b11', name: 'Agnostic Hospitality Group' },
  { id: '6a1f0c2d-4333-47ba-8fbc-4d8b25c11ec3', name: 'Eurasia City Escapes' },
  { id: '01d2b496-6be4-4ae0-94f4-2eb1b876fae2', name: 'Anatolia Boutique Hotels' },
];

const tenantOptions: TenantOption[] = defaultTenantOptions.some((tenant) => tenant.id === environmentTenantId)
  ? defaultTenantOptions.map((tenant) =>
      tenant.id === environmentTenantId ? { ...tenant, name: `${tenant.name} (varsayılan)` } : tenant
    )
  : [{ id: environmentTenantId, name: 'Varsayılan Tenant' }, ...defaultTenantOptions];

const domainOptions: DomainOption[] = [
  {
    id: 'admin',
    label: 'Merkezi yönetim',
    host: 'admin.agnostic.com',
    description: 'Çok kiracılı altyapı ve teknik ekip özellikleri',
  },
  {
    id: 'company',
    label: 'Şirket paneli',
    host: 'company.agnostic.com',
    description: 'Operasyon, rezervasyon ve gelir yönetimi',
  },
  {
    id: 'user',
    label: 'Misafir hesabı',
    host: 'user.agnostic.com',
    description: 'Rezervasyon takibi ve destek',
  },
];

function resolveInitialTenantId() {
  if (typeof window !== 'undefined') {
    const persistedTenant = window.localStorage.getItem(testToolbarStorageKey);
    if (persistedTenant) {
      return persistedTenant;
    }
  }

  return defaultTenantId;
}

const initialTenantId = resolveInitialTenantId();
const preferredLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || 'tr-TR';

const createUserKey = (email: string, tenantId: string) => `${email.trim().toLowerCase()}::${tenantId}`;

const getTenantName = (tenantId: string) => tenantOptions.find((tenant) => tenant.id === tenantId)?.name ?? 'Seçili tenant';

const deviceIdStorageKey = 'agnostic-reservation-web-device';

const getOrCreateDeviceId = () => {
  if (typeof window === 'undefined') {
    return 'web-browser';
  }

  const existing = window.localStorage.getItem(deviceIdStorageKey);
  if (existing) {
    return existing;
  }

  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `web-${Math.random().toString(36).slice(2, 10)}`;
  try {
    window.localStorage.setItem(deviceIdStorageKey, generated);
  } catch {
    // ignore storage errors
  }

  return generated;
};

const mapProfileToRegisteredUser = (profile: ApiUserProfile, base?: RegisteredUser): RegisteredUser => ({
  id: profile.userId,
  fullName: profile.fullName,
  email: profile.email,
  tenantId: profile.tenantId,
  role: base?.role ?? 'user',
  contact: {
    phoneNumber: profile.phoneNumber,
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2 ?? '',
    city: profile.city,
    country: profile.country,
    postalCode: profile.postalCode,
  },
  billing: {
    billingName: profile.billingName,
    billingTaxNumber: profile.billingTaxNumber,
    billingAddress: profile.billingAddress,
    billingCity: profile.billingCity,
    billingCountry: profile.billingCountry,
    billingPostalCode: profile.billingPostalCode,
  },
  supportHistory: base?.supportHistory ?? [],
  tags: base?.tags ?? ['Portal'],
});

const createEmptyContactInformation = (): ContactInformation => ({
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  country: '',
  postalCode: '',
});

const createEmptyBillingInformation = (): BillingInformation => ({
  billingName: '',
  billingTaxNumber: '',
  billingAddress: '',
  billingCity: '',
  billingCountry: '',
  billingPostalCode: '',
});

const mergeUser = (current: RegisteredUser, updates: Partial<RegisteredUser>): RegisteredUser => ({
  ...current,
  ...updates,
  contact: { ...current.contact, ...updates.contact },
  billing: { ...current.billing, ...updates.billing },
  supportHistory: updates.supportHistory ?? current.supportHistory,
  tags: updates.tags ?? current.tags,
});

const createSupportInteraction = (
  subject: string,
  summary: string,
  channel: SupportInteraction['channel'],
  status: SupportInteraction['status'] = 'Alındı'
): SupportInteraction => ({
  id:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `SUP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  subject,
  summary,
  status,
  channel,
  createdAt: new Date().toISOString(),
});

const mapTicketToInteraction = (ticket: SupportTicketDto): SupportInteraction => ({
  id: ticket.id,
  subject: ticket.subject,
  summary: ticket.summary ?? '',
  status: (['Alındı', 'Yanıtlandı', 'Çözüldü'].includes(ticket.status)
    ? (ticket.status as SupportInteraction['status'])
    : 'Alındı'),
  channel: (['Portal', 'E-posta', 'Telefon', 'Canlı Sohbet'].includes(ticket.channel)
    ? (ticket.channel as SupportInteraction['channel'])
    : 'Portal'),
  createdAt: ticket.createdAt,
});

const primaryTenantId = defaultTenantOptions[0]?.id ?? tenantOptions[0].id;
const seededTenant = tenantOptions.find((tenant) => tenant.id === primaryTenantId) ?? tenantOptions[0];
const seededUserEmail = 'mert.cengiz@agnostic.com';
const seededUserKey = createUserKey(seededUserEmail, seededTenant.id);
const seededAdminEmail = 'aylin.demir@agnostic.com';
const seededAdminKey = createUserKey(seededAdminEmail, seededTenant.id);
const companyTenant = defaultTenantOptions[1] ?? seededTenant;
const seededCompanyEmail = 'selim.kaya@eurasiaescapes.com';
const seededCompanyKey = createUserKey(seededCompanyEmail, companyTenant.id);

const initialRegisteredUsers: Record<string, RegisteredUser> = {
  [seededUserKey]: {
    fullName: 'Mert Cengiz',
    email: seededUserEmail,
    password: 'agnostic123',
    tenantId: seededTenant.id,
    role: 'user',
    contact: {
      phoneNumber: '+90 532 000 12 34',
      addressLine1: 'Bağdat Caddesi No:42',
      addressLine2: 'Daire 8',
      city: 'İstanbul',
      country: 'Türkiye',
      postalCode: '34728',
    },
    billing: {
      billingName: 'Mert Cengiz',
      billingTaxNumber: '11111111111',
      billingAddress: 'Bağdat Caddesi No:42 Daire 8',
      billingCity: 'İstanbul',
      billingCountry: 'Türkiye',
      billingPostalCode: '34728',
    },
    supportHistory: [
      {
        id: 'SUP-1945',
        subject: 'Sadakat puanlarının aktarımı',
        summary: 'Eski rezervasyonlardan kazanılan puanların yeni hesaba taşınması sağlandı.',
        status: 'Çözüldü',
        channel: 'Portal',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'SUP-1832',
        subject: 'Fatura ünvanı güncellemesi',
        summary: 'Şirket bilgilerinin faturaya yansıması için muhasebe ekibi bilgilendirildi.',
        status: 'Yanıtlandı',
        channel: 'E-posta',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      },
    ],
    tags: ['VIP', 'Kurumsal'],
  },
  [seededAdminKey]: {
    fullName: 'Aylin Demir',
    email: seededAdminEmail,
    password: 'agnosticAdmin!',
    tenantId: seededTenant.id,
    role: 'admin',
    contact: {
      phoneNumber: '+90 216 555 00 12',
      addressLine1: 'Teknopark İstanbul B2 Blok',
      addressLine2: 'Kat 4',
      city: 'İstanbul',
      country: 'Türkiye',
      postalCode: '34906',
    },
    billing: {
      billingName: 'Agnostic Platform',
      billingTaxNumber: '22222222222',
      billingAddress: 'Teknopark İstanbul B2 Blok',
      billingCity: 'İstanbul',
      billingCountry: 'Türkiye',
      billingPostalCode: '34906',
    },
    supportHistory: [],
    tags: ['Yönetici'],
  },
  [seededCompanyKey]: {
    fullName: 'Selim Kaya',
    email: seededCompanyEmail,
    password: 'agnosticOps!',
    tenantId: companyTenant.id,
    role: 'company',
    contact: {
      phoneNumber: '+90 212 444 12 34',
      addressLine1: 'Karaköy İş Merkezi Kat:5',
      city: 'İstanbul',
      country: 'Türkiye',
      postalCode: '34425',
    },
    billing: {
      billingName: 'Eurasia City Escapes',
      billingTaxNumber: '33333333333',
      billingAddress: 'Karaköy İş Merkezi Kat:5',
      billingCity: 'İstanbul',
      billingCountry: 'Türkiye',
      billingPostalCode: '34425',
    },
    supportHistory: [
      {
        id: 'SUP-2077',
        subject: 'Şube özel fiyat parametresi',
        summary: 'Bodrum şubesi için dinamik fiyatlandırma eşikleri güncellendi.',
        status: 'Yanıtlandı',
        channel: 'Portal',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      },
    ],
    tags: ['Şube Yöneticisi'],
  },
};

const persistTenantSelection = (tenantId: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (tenantId === defaultTenantId) {
      window.localStorage.removeItem(testToolbarStorageKey);
    } else {
      window.localStorage.setItem(testToolbarStorageKey, tenantId);
    }
  } catch {
    // Silently ignore storage errors (private mode, quota, etc.).
  }
};

const App: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<Domain>('admin');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(initialTenantId);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, RegisteredUser>>(initialRegisteredUsers);
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginTenantId, setLoginTenantId] = useState<string>(selectedTenantId);
  const [signupTenantId, setSignupTenantId] = useState<string>(selectedTenantId);
  const [showAuthPanel, setShowAuthPanel] = useState<boolean>(false);
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [authSession, setAuthSession] = useState<AuthResult | null>(null);
  const [userProfileData, setUserProfileData] = useState<ApiUserProfile | null>(null);
  const [userReservationsOverview, setUserReservationsOverview] = useState<UserReservationsOverview | null>(null);
  const [resourceOptions, setResourceOptions] = useState<ResourceDto[]>([]);
  const [loadingUserData, setLoadingUserData] = useState<boolean>(false);

  const isAdminUser = user?.role === 'admin';
  const adminUser = isAdminUser ? user : null;

  const loadUserWorkspace = useCallback(
    async (tenantId: string, userId: string) => {
      setLoadingUserData(true);
      try {
        const [profile, reservations, resources, tickets] = await Promise.all([
          fetchUserProfile(userId),
          fetchUserReservations(tenantId, userId),
          fetchResources(tenantId),
          fetchSupportTickets(tenantId, userId),
        ]);

        setUserProfileData(profile);
        setUserReservationsOverview(reservations);
        setResourceOptions(resources);

        const supportHistory = tickets
          .map(mapTicketToInteraction)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const mappedUser = {
          ...mapProfileToRegisteredUser(profile, user ?? undefined),
          supportHistory,
        };
        const userKey = createUserKey(profile.email, tenantId);
        setRegisteredUsers((previous) => ({ ...previous, [userKey]: mappedUser }));
        setUser(mappedUser);
      } catch (error) {
        console.error('Failed to load user workspace', error);
        setAuthError('Kullanıcı verileri yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setLoadingUserData(false);
      }
    },
    [user]
  );

  const baseTenantOptions = useMemo(() => {
    if (defaultTenantOptions.some((tenant) => tenant.id === defaultTenantId)) {
      return defaultTenantOptions;
    }

    return [{ id: defaultTenantId, name: 'Varsayılan Tenant' }, ...defaultTenantOptions];
  }, []);

  const tenantOptions = useMemo(() => {
    const map = new Map<string, TenantOption>();
    baseTenantOptions.forEach((tenant) => map.set(tenant.id, tenant));

    if (selectedTenantId && !map.has(selectedTenantId)) {
      map.set(selectedTenantId, { id: selectedTenantId, name: 'Seçili Tenant' });
    }

    return Array.from(map.values()).map((tenant) => {
      if (tenant.id === defaultTenantId && !tenant.name.includes('(varsayılan)')) {
        return { ...tenant, name: `${tenant.name} (varsayılan)` };
      }

      return tenant;
    });
  }, [baseTenantOptions, selectedTenantId]);

  const defaultTenantName = useMemo(() => {
    const match = baseTenantOptions.find((tenant) => tenant.id === defaultTenantId);
    return match?.name ?? 'Varsayılan Tenant';
  }, [baseTenantOptions]);

  const availableDomains = useMemo(() => {
    if (!user || isAdminUser) {
      return domainOptions;
    }

    return domainOptions.filter((option) => option.id === user.role);
  }, [user, isAdminUser]);

  useEffect(() => {
    if (authSession) {
      return;
    }

    let cancelled = false;

    const tryResumeSession = async () => {
      try {
        const session = await resumeSession(selectedTenantId, deviceId);
        if (!session || cancelled) {
          return;
        }

        setAuthSession(session);
        setSelectedTenantId(session.tenantId);
        setSelectedDomain('user');
        setActiveView('userReservations');
        await loadUserWorkspace(session.tenantId, session.userId);
      } catch (error) {
        console.info('No existing session to resume', error);
      }
    };

    void tryResumeSession();

    return () => {
      cancelled = true;
    };
  }, [authSession, deviceId, loadUserWorkspace, selectedTenantId]);

  useEffect(() => {
    if (user && !isAdminUser && selectedDomain !== user.role) {
      setSelectedDomain(user.role);
    }
  }, [user, isAdminUser, selectedDomain]);

  useEffect(() => {
    if (selectedDomain === 'admin') {
      if (!['dashboard', 'localization', 'logs', 'profile', 'supportCenter'].includes(activeView)) {
        setActiveView('dashboard');
      }
    } else if (selectedDomain === 'company') {
      if (!['companyOverview', 'companyReservations', 'companyOperations'].includes(activeView)) {
        setActiveView('companyOverview');
      }
    } else if (selectedDomain === 'user') {
      if (user) {
        if (!['userReservations', 'userProfile', 'userSupport'].includes(activeView)) {
          setActiveView('userReservations');
        }
      } else if (activeView !== 'userHome') {
        setActiveView('userHome');
      }
    }
  }, [selectedDomain, activeView, user, isAdminUser]);

  useEffect(() => {
    if (activeView === 'profile' && (!user || !isAdminUser)) {
      setActiveView('dashboard');
    }

    if (!user && ['userReservations', 'userProfile', 'userSupport'].includes(activeView)) {
      setActiveView('userHome');
    }
  }, [activeView, user, isAdminUser]);

  useEffect(() => {
    if (!user) {
      setLoginTenantId(selectedTenantId);
      setSignupTenantId(selectedTenantId);
    }
  }, [selectedTenantId, user]);

  useEffect(() => {
    if (selectedDomain !== 'admin') {
      setShowAuthPanel(false);
    }
  }, [selectedDomain]);

  const selectedTenantName = useMemo(() => getTenantName(selectedTenantId), [selectedTenantId]);
  const activeDomain = useMemo(
    () => domainOptions.find((option) => option.id === selectedDomain) ?? domainOptions[0],
    [selectedDomain]
  );

  const handleDomainChange = (domainId: string) => {
    setSelectedDomain(domainId as Domain);
  };

  const handleTenantChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tenantId = event.target.value;
    persistTenantSelection(tenantId);
    setSelectedTenantId(tenantId);
  };

  const handleTenantSelect = (tenantId: string) => {
    persistTenantSelection(tenantId);
    setSelectedTenantId(tenantId);
  };

  const handleToolbarTenantChange = (tenantId: string) => {
    handleTenantSelect(tenantId);
  };

  const handleToolbarReset = () => {
    handleTenantSelect(defaultTenantId);
  };

  const isTenantOverrideActive = selectedTenantId !== defaultTenantId;

  const updateRegisteredUser = useCallback(
    (userKey: string, apply: (current: RegisteredUser) => RegisteredUser) => {
      setRegisteredUsers((previous) => {
        const existing = previous[userKey];
        if (!existing) {
          return previous;
        }

        const updated = apply(existing);
        if (updated === existing) {
          return previous;
        }

        return { ...previous, [userKey]: updated };
      });

      setUser((current) => {
        if (!current) {
          return current;
        }

        const currentKey = createUserKey(current.email, current.tenantId);
        if (currentKey !== userKey) {
          return current;
        }

        return apply(current);
      });
    },
    [setRegisteredUsers, setUser]
  );

  const handleGoToLocalization = () => {
    if (!isAdminUser) {
      return;
    }

    setSelectedDomain('admin');
    setActiveView('localization');
    setShowAuthPanel(false);
  };

  const handleGoToLogs = () => {
    if (!isAdminUser) {
      return;
    }

    setSelectedDomain('admin');
    setActiveView('logs');
    setShowAuthPanel(false);
  };

  const handleCurrentUserProfileUpdate = useCallback(
    async (profileUpdates: { contact?: ContactInformation; billing?: BillingInformation }) => {
      if (!user || !authSession) {
        return;
      }

      const payload: UpdateUserProfilePayload = {};
      if (profileUpdates.contact) {
        payload.phoneNumber = profileUpdates.contact.phoneNumber;
        payload.addressLine1 = profileUpdates.contact.addressLine1;
        payload.addressLine2 = profileUpdates.contact.addressLine2 ?? '';
        payload.city = profileUpdates.contact.city;
        payload.country = profileUpdates.contact.country;
        payload.postalCode = profileUpdates.contact.postalCode;
      }
      if (profileUpdates.billing) {
        payload.billingName = profileUpdates.billing.billingName;
        payload.billingTaxNumber = profileUpdates.billing.billingTaxNumber;
        payload.billingAddress = profileUpdates.billing.billingAddress;
        payload.billingCity = profileUpdates.billing.billingCity;
        payload.billingCountry = profileUpdates.billing.billingCountry;
        payload.billingPostalCode = profileUpdates.billing.billingPostalCode;
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      try {
        const updatedProfile = await apiUpdateUserProfile(authSession.userId, payload);
        setUserProfileData(updatedProfile);
        const mappedUser = mapProfileToRegisteredUser(updatedProfile, user);
        setUser(mappedUser);
        const key = createUserKey(mappedUser.email, mappedUser.tenantId);
        updateRegisteredUser(key, () => mappedUser);
      } catch (error) {
        console.error('Profile update failed', error);
        setAuthError('Profil güncellemesi başarısız oldu.');
      }
    },
    [authSession, updateRegisteredUser, user]
  );

  const handleCurrentUserSupportRequest = useCallback(
    async (subject: string, summary: string) => {
      if (!user || !authSession) {
        return;
      }

      try {
        await createSupportTicket({
          tenantId: authSession.tenantId,
          userId: authSession.userId,
          subject,
          summary,
          status: 'Alındı',
          channel: 'Portal',
        });

        const tickets = await fetchSupportTickets(authSession.tenantId, authSession.userId);
        const supportHistory = tickets
          .map(mapTicketToInteraction)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const key = createUserKey(user.email, user.tenantId);
        updateRegisteredUser(key, (current) => mergeUser(current, { supportHistory }));
      } catch (error) {
        console.error('Support request create failed', error);
        setAuthError('Destek talebi kaydedilemedi. Lütfen tekrar deneyin.');
      }
    },
    [authSession, updateRegisteredUser, user]
  );

  const handleReservationCreate = useCallback(
    async (request: { resourceId: string; startUtc: string; endUtc: string }) => {
      if (!authSession) {
        return;
      }

      try {
        await apiCreateReservation({
          tenantId: authSession.tenantId,
          userId: authSession.userId,
          resourceId: request.resourceId,
          startUtc: request.startUtc,
          endUtc: request.endUtc,
        });
        await loadUserWorkspace(authSession.tenantId, authSession.userId);
      } catch (error) {
        console.error('Reservation create failed', error);
        setAuthError('Rezervasyon eklenemedi.');
      }
    },
    [authSession, loadUserWorkspace]
  );

  const handleReservationUpdate = useCallback(
    async (reservationId: string, updates: { startUtc?: string; endUtc?: string; status?: string }) => {
      if (!authSession) {
        return;
      }

      try {
        await apiUpdateReservation({
          reservationId,
          tenantId: authSession.tenantId,
          startUtc: updates.startUtc,
          endUtc: updates.endUtc,
          status: updates.status,
        });
        await loadUserWorkspace(authSession.tenantId, authSession.userId);
      } catch (error) {
        console.error('Reservation update failed', error);
        setAuthError('Rezervasyon güncellenemedi.');
      }
    },
    [authSession, loadUserWorkspace]
  );

  const handleReservationDelete = useCallback(
    async (reservationId: string) => {
      if (!authSession) {
        return;
      }

      try {
        await apiDeleteReservation(reservationId, authSession.tenantId);
        await loadUserWorkspace(authSession.tenantId, authSession.userId);
      } catch (error) {
        console.error('Reservation delete failed', error);
        setAuthError('Rezervasyon silinemedi.');
      }
    },
    [authSession, loadUserWorkspace]
  );

  const handleSupportCenterUpdate = useCallback(
    (userKey: string, updates: Partial<RegisteredUser>) => {
      updateRegisteredUser(userKey, (current) => mergeUser(current, updates));
    },
    [updateRegisteredUser]
  );

  const handleSupportCenterInteraction = useCallback(
    async (
      userKey: string,
      subject: string,
      summary: string,
      status: SupportInteraction['status'],
      channel: SupportInteraction['channel']
    ) => {
      const targetUser = registeredUsers[userKey];

      if (targetUser?.id) {
        try {
          const ticket = await createSupportTicket({
            tenantId: targetUser.tenantId,
            userId: targetUser.id,
            subject,
            summary,
            status,
            channel,
          });

          const interaction = mapTicketToInteraction(ticket);
          updateRegisteredUser(userKey, (current) =>
            mergeUser(current, { supportHistory: [interaction, ...current.supportHistory] })
          );
          return;
        } catch (error) {
          console.error('Support interaction create failed', error);
          setAuthError('Destek kaydı oluşturulamadı.');
        }
      }

      const fallback = createSupportInteraction(subject, summary, channel, status);
      updateRegisteredUser(userKey, (current) =>
        mergeUser(current, { supportHistory: [fallback, ...current.supportHistory] })
      );
    },
    [registeredUsers, updateRegisteredUser]
  );

  const handleCloseAuthPanel = () => {
    setShowAuthPanel(false);
    setAuthError(null);
  };

  const handleOpenLogin = () => {
    setAuthMode('login');
    setAuthError(null);
    if (selectedDomain === 'admin') {
      setActiveView('dashboard');
      setShowAuthPanel(true);
    } else if (selectedDomain === 'user') {
      setActiveView(user ? 'userReservations' : 'userHome');
    }
  };

  const handleOpenSignup = () => {
    setAuthMode('signup');
    setAuthError(null);
    if (selectedDomain === 'admin') {
      setActiveView('dashboard');
      setShowAuthPanel(true);
    } else if (selectedDomain === 'user') {
      setActiveView('userHome');
    }
  };

  const handleLogout = async () => {
    if (authSession) {
      try {
        await apiSignOut({ tenantId: authSession.tenantId, userId: authSession.userId, deviceId });
      } catch (error) {
        console.warn('Logout request failed', error);
      }
    }

    setAuthSession(null);
    setUser(null);
    setUserProfileData(null);
    setUserReservationsOverview(null);
    setResourceOptions([]);
    setAuthError(null);
    setAuthMode('login');
    setSelectedDomain('admin');
    setActiveView('dashboard');
    setShowAuthPanel(false);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      setAuthError('Lütfen e-posta ve şifre bilgilerinizi eksiksiz girin.');
      return;
    }

    try {
      const tenantId = loginTenantId || selectedTenantId;
      const result = await apiSignIn({ tenantId, email, password, deviceId });
      setAuthSession(result);
      persistTenantSelection(tenantId);
      setSelectedTenantId(tenantId);
      setSelectedDomain('user');
      setActiveView('userReservations');
      setShowAuthPanel(false);
      setAuthError(null);
      await loadUserWorkspace(tenantId, result.userId);
    } catch (error) {
      console.error('Login failed', error);
      setAuthError('Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      (event.currentTarget as HTMLFormElement).reset();
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!fullName || !email || !password) {
      setAuthError('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      const tenantId = signupTenantId || selectedTenantId;
      const result = await apiSignUp({
        tenantId,
        email,
        password,
        fullName,
        preferredTheme: 'light',
        preferredLanguage: navigator.language ?? 'tr-TR',
        deviceId,
      });
      setAuthSession(result);
      persistTenantSelection(tenantId);
      setSelectedTenantId(tenantId);
      setSelectedDomain('user');
      setActiveView('userReservations');
      setAuthMode('login');
      setLoginTenantId(tenantId);
      setShowAuthPanel(false);
      setAuthError(null);
      await loadUserWorkspace(tenantId, result.userId);
    } catch (error) {
      console.error('Signup failed', error);
      setAuthError('Kayıt işlemi gerçekleştirilemedi. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      (event.currentTarget as HTMLFormElement).reset();
    }
  };

  const dashboardLayoutClassName = [
    'dashboard-layout',
    isAdminUser || (showAuthPanel && selectedDomain === 'admin')
      ? 'dashboard-layout--with-aside'
      : 'dashboard-layout--single',
  ].join(' ');

  const resolvedUserView: 'userReservations' | 'userProfile' | 'userSupport' =
    activeView === 'userProfile' ? 'userProfile' : activeView === 'userSupport' ? 'userSupport' : 'userReservations';
  const supportDirectory = useMemo(
    () =>
      Object.entries(registeredUsers)
        .filter(([, userRecord]) => userRecord.tenantId === selectedTenantId)
        .map(([key, userRecord]) => ({ key, user: userRecord })),
    [registeredUsers, selectedTenantId]
  );

  return (
    <LocalizationProvider tenantId={selectedTenantId} initialLanguage={preferredLanguage}>
      <div className="app-shell">
        <div className="app-container">
          <TestToolbar
            domainOptions={domainOptions}
            selectedDomainId={selectedDomain}
            activeDomainHost={activeDomain.host}
            activeDomainDescription={activeDomain.description}
            onDomainChange={handleDomainChange}
            tenantOptions={tenantOptions}
            selectedTenantId={selectedTenantId}
            defaultTenantName={defaultTenantName}
            onTenantChange={handleToolbarTenantChange}
            onResetToDefault={handleToolbarReset}
            isOverrideActive={isTenantOverrideActive}
          />
          <header className="app-header">
            <div className="app-header__brand">
              <span className="app-header__title">Agnostic Reservation</span>
              <span className="app-header__subtitle">Çok kiracılı rezervasyon yönetimi platformu</span>
            </div>

            <div className="app-header__nav" aria-label="Ana gezinme">
              {selectedDomain === 'admin' && (
                <>
                  <button
                    type="button"
                    className={
                      activeView === 'dashboard'
                        ? 'app-header__nav-button app-header__nav-button--active'
                        : 'app-header__nav-button'
                    }
                    onClick={() => setActiveView('dashboard')}
                  >
                    Ana sayfa
                  </button>
                  <button
                    type="button"
                    className={
                      activeView === 'localization'
                        ? 'app-header__nav-button app-header__nav-button--active'
                        : 'app-header__nav-button'
                    }
                    onClick={() => setActiveView('localization')}
                  >
                    Lokalizasyon
                  </button>
                  <button
                    type="button"
                    className={
                      activeView === 'logs'
                        ? 'app-header__nav-button app-header__nav-button--active'
                        : 'app-header__nav-button'
                    }
                    onClick={() => setActiveView('logs')}
                  >
                    Log yönetimi
                  </button>
                  <button
                    type="button"
                    className={
                      activeView === 'supportCenter'
                        ? 'app-header__nav-button app-header__nav-button--active'
                        : 'app-header__nav-button'
                    }
                    onClick={() => {
                      setActiveView('supportCenter');
                      setShowAuthPanel(false);
                    }}
                  >
                    Destek merkezi
                  </button>
                  {user && (
                    <button
                      type="button"
                      className={
                        activeView === 'profile'
                          ? 'app-header__nav-button app-header__nav-button--active'
                          : 'app-header__nav-button'
                      }
                      onClick={() => {
                        setActiveView('profile');
                        setShowAuthPanel(false);
                      }}
                    >
                      Profilim
                    </button>
                  )}
                </>
              )}

              {selectedDomain === 'company' && (
                <>
                  <button
                    type="button"
                    className={
                      activeView === 'companyOverview'
                        ? 'app-header__nav-button app-header__nav-button--active'
                        : 'app-header__nav-button'
                    }
                    onClick={() => setActiveView('companyOverview')}
                  >
                    Genel bakış
                  </button>
                  <button
                    type="button"
                    className={
                      activeView === 'companyReservations'
                        ? 'app-header__nav-button app-header__nav-button--active'
                        : 'app-header__nav-button'
                    }
                    onClick={() => setActiveView('companyReservations')}
                  >
                    Rezervasyon akışı
                  </button>
                  <button
                    type="button"
                    className={
                      activeView === 'companyOperations'
                        ? 'app-header__nav-button app-header__nav-button--active'
                        : 'app-header__nav-button'
                    }
                    onClick={() => setActiveView('companyOperations')}
                  >
                    Operasyonlar
                  </button>
                </>
              )}

              {selectedDomain === 'user' && (
                <>
                  <button
                    type="button"
                    className={
                      activeView === 'userReservations'
                        ? 'app-header__nav-button app-header__nav-button--active'
                        : 'app-header__nav-button'
                    }
                    onClick={() => setActiveView(user ? 'userReservations' : 'userHome')}
                  >
                    Rezervasyonlarım
                  </button>
                  <button
                    type="button"
                    className={
                      activeView === 'userProfile'
                        ? 'app-header__nav-button app-header__nav-button--active'
                        : 'app-header__nav-button'
                    }
                    onClick={() => user && setActiveView('userProfile')}
                    disabled={!user}
                  >
                    Profilim
                  </button>
                  <button
                    type="button"
                    className={
                      activeView === 'userSupport'
                        ? 'app-header__nav-button app-header__nav-button--active'
                        : 'app-header__nav-button'
                    }
                    onClick={() => user && setActiveView('userSupport')}
                    disabled={!user}
                  >
                    Destek
                  </button>
                </>
              )}
            </div>

            <div className="app-header__controls">
              {user ? (
                <div className="user-chip">
                  <span className="user-chip__avatar" aria-hidden>
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                  <div className="user-chip__details">
                    <span className="user-chip__name">{user.fullName}</span>
                    <button type="button" onClick={handleLogout} className="user-chip__logout">
                      Çıkış yap
                    </button>
                  </div>
                </div>
              ) : (
                <div className="header-auth-links">
                  <button type="button" onClick={handleOpenLogin}>
                    Giriş
                  </button>
                  <button type="button" onClick={handleOpenSignup}>
                    Kayıt
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="app-main">
            {selectedDomain === 'admin' && (
              <>
                {activeView === 'dashboard' && (
                  <div className={dashboardLayoutClassName}>
                    <NonUserDashboard
                      selectedTenantName={selectedTenantName}
                      isAdmin={isAdminUser}
                      onExploreLocalization={isAdminUser ? handleGoToLocalization : undefined}
                      onExploreLogs={isAdminUser ? handleGoToLogs : undefined}
                    />

                    {adminUser ? (
                      <aside className="profile-summary">
                        <h2>Tekrar hoş geldiniz</h2>
                        <p>
                          {adminUser.fullName} olarak <strong>{selectedTenantName}</strong> tenant’ı üzerinde çalışıyorsunuz. Profil
                          sayfanız üzerinden kişisel bilgilerinizi yönetin ve uygulama özelliklerine erişin.
                        </p>
                        <div className="profile-summary__details">
                          <span>{adminUser.email}</span>
                          <span>Tenant: {selectedTenantName}</span>
                        </div>
                        <div className="profile-summary__actions">
                          <button type="button" onClick={() => setActiveView('profile')}>
                            Profilime git
                          </button>
                          <button type="button" onClick={() => setActiveView('localization')}>
                            Lokalizasyonu yönet
                          </button>
                          <button type="button" onClick={() => setActiveView('logs')}>
                            Logları incele
                          </button>
                        </div>
                      </aside>
                    ) : showAuthPanel ? (
                      <aside className="auth-card">
                        <div className="auth-card__header">
                          <h2>Hesabınıza giriş yapın</h2>
                          <button
                            type="button"
                            className="auth-card__close"
                            onClick={handleCloseAuthPanel}
                            aria-label="Kimlik doğrulama panelini kapat"
                          >
                            ×
                          </button>
                        </div>
                        <div className="auth-card__tabs" role="tablist" aria-label="Kimlik doğrulama">
                          <button
                            type="button"
                            role="tab"
                            aria-selected={authMode === 'login'}
                            className={
                              authMode === 'login' ? 'auth-card__tab auth-card__tab--active' : 'auth-card__tab'
                            }
                            onClick={() => {
                              setAuthMode('login');
                              setAuthError(null);
                            }}
                          >
                            Giriş Yap
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={authMode === 'signup'}
                            className={
                              authMode === 'signup' ? 'auth-card__tab auth-card__tab--active' : 'auth-card__tab'
                            }
                            onClick={() => {
                              setAuthMode('signup');
                              setAuthError(null);
                            }}
                          >
                            Kayıt Ol
                          </button>
                        </div>

                        {authMode === 'login' ? (
                          <form className="auth-card__form" onSubmit={handleLogin}>
                            <label>
                              <span>Tenant</span>
                              <select value={loginTenantId} onChange={(event) => setLoginTenantId(event.target.value)}>
                                {tenantOptions.map((tenant) => (
                                  <option key={tenant.id} value={tenant.id}>
                                    {tenant.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              <span>E-posta</span>
                              <input type="email" name="email" placeholder="ornek@tesis.com" required />
                            </label>
                            <label>
                              <span>Şifre</span>
                              <input type="password" name="password" placeholder="••••••••" required />
                            </label>
                            <button type="submit" className="auth-card__submit">
                              Giriş yap
                            </button>
                          </form>
                        ) : (
                          <form className="auth-card__form" onSubmit={handleSignup}>
                            <label>
                              <span>Ad Soyad</span>
                              <input type="text" name="fullName" placeholder="Adınız Soyadınız" required />
                            </label>
                            <label>
                              <span>Tenant</span>
                              <select value={signupTenantId} onChange={(event) => setSignupTenantId(event.target.value)}>
                                {tenantOptions.map((tenant) => (
                                  <option key={tenant.id} value={tenant.id}>
                                    {tenant.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              <span>E-posta</span>
                              <input type="email" name="email" placeholder="ornek@tesis.com" required />
                            </label>
                            <label>
                              <span>Şifre</span>
                              <input type="password" name="password" placeholder="En az 6 karakter" required minLength={6} />
                            </label>
                            <button type="submit" className="auth-card__submit">
                              Hesap oluştur
                            </button>
                          </form>
                        )}

                        {authError && <p className="auth-card__error">{authError}</p>}
                      </aside>
                    ) : (
                      <aside className="welcome-card">
                        <h2>Panel özetini keşfedin</h2>
                        <p>
                          Üst menüdeki tenant ve oturum kontrolleri sadeleştirildi. Yönetici yetkisine sahip değilseniz, burada
                          yalnızca platformun genel kabiliyetlerine dair bir ön izleme görürsünüz.
                        </p>
                        <p>
                          Yönetici olarak oturum açmak için üst bardaki <strong>Giriş</strong> bağlantısını kullanabilir veya
                          yetkili ekip ile iletişime geçebilirsiniz.
                        </p>
                      </aside>
                    )}
                  </div>
                )}

                {activeView === 'profile' && adminUser && (
                  <section className="profile-card">
                    <header>
                      <h1>{adminUser.fullName}</h1>
                      <p>
                        Hesabınıza bağlı tenant: <strong>{selectedTenantName}</strong>. Kişisel bilgilerinizi güncelleyin ve
                        platform deneyiminizi yönetin.
                      </p>
                    </header>
                    <div className="profile-card__grid">
                      <article>
                        <h2>Hesap bilgileri</h2>
                        <ul>
                          <li>E-posta: {adminUser.email}</li>
                          <li>Tenant: {selectedTenantName}</li>
                        </ul>
                      </article>
                      <article>
                        <h2>Hızlı işlemler</h2>
                        <div className="profile-card__actions">
                          <button type="button" onClick={() => setActiveView('localization')}>
                            Lokalizasyon yönetimine geç
                          </button>
                          <button type="button" onClick={() => setActiveView('logs')}>
                            Log yönetimini aç
                          </button>
                        </div>
                      </article>
                    </div>
                  </section>
                )}

                {activeView === 'supportCenter' && (
                  <AdminSupportPanel
                    tenantName={selectedTenantName}
                    users={supportDirectory}
                    onUpdateUser={handleSupportCenterUpdate}
                    onCreateInteraction={handleSupportCenterInteraction}
                  />
                )}

                {(activeView === 'localization' || activeView === 'logs') && (
                  isAdminUser ? (
                    <div className="admin-layout">
                      <nav className="admin-layout__tabs" aria-label="Yönetim sekmeleri">
                        <button
                          type="button"
                          className={
                            activeView === 'localization'
                              ? 'admin-layout__tab admin-layout__tab--active'
                              : 'admin-layout__tab'
                          }
                          onClick={() => setActiveView('localization')}
                        >
                          Lokalizasyon
                        </button>
                        <button
                          type="button"
                          className={
                            activeView === 'logs' ? 'admin-layout__tab admin-layout__tab--active' : 'admin-layout__tab'
                          }
                          onClick={() => setActiveView('logs')}
                        >
                          Mongo Logları
                        </button>
                      </nav>

                      <div className="admin-layout__content">
                        {activeView === 'localization' ? (
                          <LocalizationAdmin tenantId={selectedTenantId} />
                        ) : (
                          <LogsAdmin tenantId={selectedTenantId} />
                        )}
                      </div>
                    </div>
                  ) : (
                    <section className="restricted-card">
                      <h2>Erişim kısıtlandı</h2>
                      <p>Log izleme ve lokalizasyon ekranları yalnızca yönetici rolündeki kullanıcılar için etkinleştirilir.</p>
                    </section>
                  )
                )}
              </>
            )}

            {selectedDomain === 'company' && (
              <CompanyDashboard tenantName={selectedTenantName} activeView={activeView} />
            )}

            {selectedDomain === 'user' && (
              <>
                {user && userProfileData ? (
                  <UserDashboard
                    userName={user.fullName}
                    userEmail={user.email}
                    tenantName={selectedTenantName}
                    reservations={userReservationsOverview?.reservations ?? []}
                    timeline={userReservationsOverview?.timeline ?? []}
                    resources={resourceOptions.map((resource) => ({ id: resource.id, name: resource.name }))}
                    activeView={resolvedUserView}
                    contact={user.contact}
                    billing={user.billing}
                    supportHistory={user.supportHistory}
                    tags={user.tags ?? []}
                    loading={loadingUserData}
                    onProfileUpdate={handleCurrentUserProfileUpdate}
                    onCreateSupportRequest={handleCurrentUserSupportRequest}
                    onReservationCreate={handleReservationCreate}
                    onReservationUpdate={handleReservationUpdate}
                    onReservationDelete={handleReservationDelete}
                  />
                ) : (
                  <section className="user-access">
                    <div className="user-access__hero">
                      <span className="user-access__badge">user.agnostic.com</span>
                      <h1>Misafir paneline hoş geldiniz</h1>
                      <p>
                        Rezervasyonlarınızı takip etmek, sadakat avantajlarınızı görmek ve destek ekibiyle iletişime geçmek için
                        hesabınıza giriş yapın. Test ortamı için hazır kullanıcı: <strong>mert.cengiz@agnostic.com</strong> /{' '}
                        <strong>agnostic123</strong>
                      </p>
                    </div>
                    <div className="user-access__card">
                      <div className="user-access__tabs" role="tablist" aria-label="Misafir kimlik doğrulama">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={authMode === 'login'}
                          className={authMode === 'login' ? 'user-access__tab user-access__tab--active' : 'user-access__tab'}
                          onClick={() => {
                            setAuthMode('login');
                            setAuthError(null);
                          }}
                        >
                          Giriş Yap
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={authMode === 'signup'}
                          className={authMode === 'signup' ? 'user-access__tab user-access__tab--active' : 'user-access__tab'}
                          onClick={() => {
                            setAuthMode('signup');
                            setAuthError(null);
                          }}
                        >
                          Kayıt Ol
                        </button>
                      </div>

                      {authMode === 'login' ? (
                        <form className="user-access__form" onSubmit={handleLogin}>
                          <label>
                            <span>Tenant</span>
                            <select value={loginTenantId} onChange={(event) => setLoginTenantId(event.target.value)}>
                              {tenantOptions.map((tenant) => (
                                <option key={tenant.id} value={tenant.id}>
                                  {tenant.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>E-posta</span>
                            <input type="email" name="email" placeholder="ornek@tesis.com" required />
                          </label>
                          <label>
                            <span>Şifre</span>
                            <input type="password" name="password" placeholder="••••••••" required />
                          </label>
                          <button type="submit">Giriş yap</button>
                        </form>
                      ) : (
                        <form className="user-access__form" onSubmit={handleSignup}>
                          <label>
                            <span>Ad Soyad</span>
                            <input type="text" name="fullName" placeholder="Adınız Soyadınız" required />
                          </label>
                          <label>
                            <span>Tenant</span>
                            <select value={signupTenantId} onChange={(event) => setSignupTenantId(event.target.value)}>
                              {tenantOptions.map((tenant) => (
                                <option key={tenant.id} value={tenant.id}>
                                  {tenant.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>E-posta</span>
                            <input type="email" name="email" placeholder="ornek@tesis.com" required />
                          </label>
                          <label>
                            <span>Şifre</span>
                            <input type="password" name="password" placeholder="En az 6 karakter" required minLength={6} />
                          </label>
                          <button type="submit">Hesap oluştur</button>
                        </form>
                      )}

                      {authError && <p className="user-access__error">{authError}</p>}
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default App;

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
  Reservation,
  SupportInteraction,
} from './types/domain';

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

const createEmptyContactInformation = (): ContactInformation => ({
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  country: '',
  postalCode: '',
});

const createEmptyBillingInformation = (): BillingInformation => ({
  cardHolderName: '',
  cardBrand: 'VISA',
  cardLast4: '',
  expiryMonth: '',
  expiryYear: '',
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

const toISODate = (date: Date) => date.toISOString().split('T')[0];

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const generateSampleReservations = (tenantName: string, fullName: string): Reservation[] => {
  const base = new Date();
  const firstStart = addDays(base, 18);
  const firstEnd = addDays(firstStart, 3);
  const secondStart = addDays(base, 45);
  const secondEnd = addDays(secondStart, 4);
  const pastStart = addDays(base, -26);
  const pastEnd = addDays(pastStart, 2);
  const guestShortName = fullName.split(' ')[0];

  return [
    {
      id: `AR-${firstStart.getTime().toString().slice(-4)}`,
      propertyName: `${tenantName} · Panorama Süit`,
      checkIn: toISODate(firstStart),
      checkOut: toISODate(firstEnd),
      nights: 3,
      guests: 2,
      status: 'Onaylandı',
      totalPrice: 7200,
      channel: 'Web Sitesi',
      notes: `${guestShortName} için özel karşılama kartı`,
    },
    {
      id: `AR-${secondStart.getTime().toString().slice(-4)}`,
      propertyName: `${tenantName} · Executive Oda`,
      checkIn: toISODate(secondStart),
      checkOut: toISODate(secondEnd),
      nights: 4,
      guests: 2,
      status: 'Beklemede',
      totalPrice: 8600,
      channel: 'Mobil Uygulama',
    },
    {
      id: `AR-${pastStart.getTime().toString().slice(-4)}`,
      propertyName: `${tenantName} · Deluxe Oda`,
      checkIn: toISODate(pastStart),
      checkOut: toISODate(pastEnd),
      nights: 2,
      guests: 1,
      status: 'İptal',
      totalPrice: 3400,
      channel: 'Çağrı Merkezi',
      notes: 'Misafir isteği ile ücretsiz iptal yapıldı.',
    },
  ];
};

const primaryTenantId = defaultTenantOptions[0]?.id ?? tenantOptions[0].id;
const seededTenant = tenantOptions.find((tenant) => tenant.id === primaryTenantId) ?? tenantOptions[0];
const seededUserEmail = 'mert.cengiz@agnostic.com';
const seededUserKey = createUserKey(seededUserEmail, seededTenant.id);

const initialRegisteredUsers: Record<string, RegisteredUser> = {
  [seededUserKey]: {
    fullName: 'Mert Cengiz',
    email: seededUserEmail,
    password: 'agnostic123',
    tenantId: seededTenant.id,
    contact: {
      phoneNumber: '+90 532 000 12 34',
      addressLine1: 'Bağdat Caddesi No:42',
      addressLine2: 'Daire 8',
      city: 'İstanbul',
      country: 'Türkiye',
      postalCode: '34728',
    },
    billing: {
      cardHolderName: 'Mert Cengiz',
      cardBrand: 'VISA',
      cardLast4: '4242',
      expiryMonth: '08',
      expiryYear: '27',
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
};

const initialReservations: Record<string, Reservation[]> = {
  [seededUserKey]: [
    {
      id: 'AR-4521',
      propertyName: `${seededTenant.name} · Superior Oda`,
      checkIn: '2024-04-18',
      checkOut: '2024-04-21',
      nights: 3,
      guests: 2,
      status: 'Onaylandı',
      totalPrice: 6800,
      channel: 'Mobil Uygulama',
      notes: 'Geç giriş talebi onaylandı.',
    },
    {
      id: 'AR-4396',
      propertyName: `${seededTenant.name} · City View Suite`,
      checkIn: '2024-05-02',
      checkOut: '2024-05-05',
      nights: 3,
      guests: 2,
      status: 'Beklemede',
      totalPrice: 7400,
      channel: 'Web Sitesi',
    },
    {
      id: 'AR-4102',
      propertyName: `${seededTenant.name} · Corner Oda`,
      checkIn: '2024-03-08',
      checkOut: '2024-03-10',
      nights: 2,
      guests: 1,
      status: 'İptal',
      totalPrice: 3150,
      channel: 'Çağrı Merkezi',
      notes: 'Konaklama tarihi değişikliği nedeniyle iptal edildi.',
    },
  ],
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
  const [reservationsByUser, setReservationsByUser] = useState<Record<string, Reservation[]>>(initialReservations);
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginTenantId, setLoginTenantId] = useState<string>(selectedTenantId);
  const [signupTenantId, setSignupTenantId] = useState<string>(selectedTenantId);
  const [showAuthPanel, setShowAuthPanel] = useState<boolean>(false);

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
  }, [selectedDomain, activeView, user]);

  useEffect(() => {
    if (activeView === 'profile' && !user) {
      setActiveView('dashboard');
    }

    if (!user && ['userReservations', 'userProfile', 'userSupport'].includes(activeView)) {
      setActiveView('userHome');
    }
  }, [activeView, user]);

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
    setSelectedDomain('admin');
    setActiveView('localization');
    setShowAuthPanel(false);
  };

  const handleGoToLogs = () => {
    setSelectedDomain('admin');
    setActiveView('logs');
    setShowAuthPanel(false);
  };

  const handleCurrentUserProfileUpdate = useCallback(
    (profileUpdates: { contact?: ContactInformation; billing?: BillingInformation }) => {
      if (!user) {
        return;
      }

      const updates: Partial<RegisteredUser> = {};
      if (profileUpdates.contact) {
        updates.contact = profileUpdates.contact;
      }
      if (profileUpdates.billing) {
        updates.billing = profileUpdates.billing;
      }

      if (Object.keys(updates).length === 0) {
        return;
      }

      const key = createUserKey(user.email, user.tenantId);
      updateRegisteredUser(key, (current) => mergeUser(current, updates));
    },
    [updateRegisteredUser, user]
  );

  const handleCurrentUserSupportRequest = useCallback(
    (subject: string, summary: string) => {
      if (!user) {
        return;
      }

      const interaction = createSupportInteraction(subject, summary, 'Portal');
      const key = createUserKey(user.email, user.tenantId);
      updateRegisteredUser(key, (current) =>
        mergeUser(current, { supportHistory: [interaction, ...current.supportHistory] })
      );
    },
    [updateRegisteredUser, user]
  );

  const handleSupportCenterUpdate = useCallback(
    (userKey: string, updates: Partial<RegisteredUser>) => {
      updateRegisteredUser(userKey, (current) => mergeUser(current, updates));
    },
    [updateRegisteredUser]
  );

  const handleSupportCenterInteraction = useCallback(
    (
      userKey: string,
      subject: string,
      summary: string,
      status: SupportInteraction['status'],
      channel: SupportInteraction['channel']
    ) => {
      const interaction = createSupportInteraction(subject, summary, channel, status);
      updateRegisteredUser(userKey, (current) =>
        mergeUser(current, { supportHistory: [interaction, ...current.supportHistory] })
      );
    },
    [updateRegisteredUser]
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

  const handleLogout = () => {
    setUser(null);
    setAuthError(null);
    setAuthMode('login');
    if (selectedDomain === 'user') {
      setActiveView('userHome');
    } else {
      setActiveView('dashboard');
    }
    setShowAuthPanel(false);
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      setAuthError('Lütfen e-posta ve şifre bilgilerinizi eksiksiz girin.');
      return;
    }

    const key = createUserKey(email, loginTenantId);
    const account = registeredUsers[key];

    if (!account) {
      setAuthError('Kayıtlı kullanıcı bulunamadı. Lütfen bilgilerinizi kontrol edin.');
      return;
    }

    if (account.password !== password) {
      setAuthError('Şifre eşleşmiyor.');
      return;
    }

    setAuthError(null);
    setUser(account);
    persistTenantSelection(account.tenantId);
    setSelectedTenantId(account.tenantId);
    setSelectedDomain('user');
    setActiveView('userReservations');
    setShowAuthPanel(false);
    (event.currentTarget as HTMLFormElement).reset();

    const tenantName = getTenantName(account.tenantId);
    setReservationsByUser((previous) => {
      if (previous[key]) {
        return previous;
      }
      return { ...previous, [key]: generateSampleReservations(tenantName, account.fullName) };
    });
  };

  const handleSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!fullName || !email || !password) {
      setAuthError('Lütfen tüm alanları doldurun.');
      return;
    }

    const key = createUserKey(email, signupTenantId);

    if (registeredUsers[key]) {
      setAuthError('Bu tenant için bu e-posta ile daha önce kayıt olunmuş.');
      return;
    }

    const newUser: RegisteredUser = {
      fullName,
      email,
      password,
      tenantId: signupTenantId,
      contact: createEmptyContactInformation(),
      billing: createEmptyBillingInformation(),
      supportHistory: [],
      tags: ['Yeni'],
    };

    const tenantName = getTenantName(signupTenantId);

    setRegisteredUsers((previous) => ({ ...previous, [key]: newUser }));
    setReservationsByUser((previous) => ({
      ...previous,
      [key]: generateSampleReservations(tenantName, fullName),
    }));
    setAuthError(null);
    setUser(newUser);
    persistTenantSelection(signupTenantId);
    setSelectedTenantId(signupTenantId);
    setSelectedDomain('user');
    setActiveView('userReservations');
    setAuthMode('login');
    setLoginTenantId(signupTenantId);
    setShowAuthPanel(false);
    (event.currentTarget as HTMLFormElement).reset();
  };

  const dashboardLayoutClassName = [
    'dashboard-layout',
    user || (showAuthPanel && selectedDomain === 'admin') ? 'dashboard-layout--with-aside' : 'dashboard-layout--single',
  ].join(' ');

  const userReservationKey = user ? createUserKey(user.email, user.tenantId) : null;
  const reservationsForUser = userReservationKey ? reservationsByUser[userReservationKey] ?? [] : [];
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
                      tenantOptions={tenantOptions}
                      selectedTenantId={selectedTenantId}
                      onSelectTenant={handleTenantSelect}
                      onExploreLocalization={handleGoToLocalization}
                      onExploreLogs={handleGoToLogs}
                      onLogin={handleOpenLogin}
                      onSignup={handleOpenSignup}
                    />

                    {user ? (
                      <aside className="profile-summary">
                        <h2>Tekrar hoş geldiniz</h2>
                        <p>
                          {user.fullName} olarak <strong>{selectedTenantName}</strong> tenant’ı üzerinde çalışıyorsunuz. Profil
                          sayfanız üzerinden kişisel bilgilerinizi yönetin ve uygulama özelliklerine erişin.
                        </p>
                        <div className="profile-summary__details">
                          <span>{user.email}</span>
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
                        <h2>Keşfetmeye hemen başlayın</h2>
                        <p>
                          Platform özelliklerini gezinebilir, tenant seçicisi üzerinden farklı işletmeler arasında geçiş yapabilir ve
                          dilediğiniz an giriş ya da kayıt işlemini başlatabilirsiniz.
                        </p>
                        <div className="welcome-card__actions">
                          <button type="button" onClick={handleOpenLogin}>
                            Giriş yap
                          </button>
                          <button type="button" onClick={handleOpenSignup}>
                            Kayıt ol
                          </button>
                        </div>
                      </aside>
                    )}
                  </div>
                )}

                {activeView === 'profile' && user && (
                  <section className="profile-card">
                    <header>
                      <h1>{user.fullName}</h1>
                      <p>
                        Hesabınıza bağlı tenant: <strong>{selectedTenantName}</strong>. Kişisel bilgilerinizi güncelleyin ve
                        platform deneyiminizi yönetin.
                      </p>
                    </header>
                    <div className="profile-card__grid">
                      <article>
                        <h2>Hesap bilgileri</h2>
                        <ul>
                          <li>E-posta: {user.email}</li>
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
                )}
              </>
            )}

            {selectedDomain === 'company' && (
              <CompanyDashboard tenantName={selectedTenantName} activeView={activeView} />
            )}

            {selectedDomain === 'user' && (
              <>
                {user ? (
                  <UserDashboard
                    userName={user.fullName}
                    userEmail={user.email}
                    tenantName={selectedTenantName}
                    reservations={reservationsForUser}
                    activeView={resolvedUserView}
                    contact={user.contact}
                    billing={user.billing}
                    supportHistory={user.supportHistory}
                    tags={user.tags ?? []}
                    onProfileUpdate={handleCurrentUserProfileUpdate}
                    onCreateSupportRequest={handleCurrentUserSupportRequest}
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

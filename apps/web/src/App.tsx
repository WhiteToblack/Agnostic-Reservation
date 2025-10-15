import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import './App.css';
import { LocalizationProvider } from './localization/LocalizationProvider';
import { LocalizationAdmin } from './localization/LocalizationAdmin';
import { LogsAdmin } from './logs/LogsAdmin';
import { NonUserDashboard } from './components/NonUserDashboard';
import { CompanyDashboard } from './components/CompanyDashboard';
import { UserDashboard } from './components/UserDashboard';
import { RegisteredUser, Reservation } from './types/domain';

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
  | 'companyOverview'
  | 'companyReservations'
  | 'companyOperations'
  | 'userHome'
  | 'userReservations'
  | 'userProfile'
  | 'userSupport';

type AuthMode = 'login' | 'signup';

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

const initialTenantId = environmentTenantId;
const preferredLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || 'tr-TR';

const createUserKey = (email: string, tenantId: string) => `${email.trim().toLowerCase()}::${tenantId}`;

const getTenantName = (tenantId: string) => tenantOptions.find((tenant) => tenant.id === tenantId)?.name ?? 'Seçili tenant';

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

const App: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<Domain>('admin');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(initialTenantId);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, RegisteredUser>>(initialRegisteredUsers);
  const [reservationsByUser, setReservationsByUser] = useState<Record<string, Reservation[]>>(initialReservations);
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginTenantId, setLoginTenantId] = useState<string>(initialTenantId);
  const [signupTenantId, setSignupTenantId] = useState<string>(initialTenantId);
  const [showAuthPanel, setShowAuthPanel] = useState<boolean>(false);

  useEffect(() => {
    if (selectedDomain === 'admin') {
      if (!['dashboard', 'localization', 'logs', 'profile'].includes(activeView)) {
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

  const handleDomainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDomain(event.target.value as Domain);
  };

  const handleTenantChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTenantId(event.target.value);
  };

  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenantId(tenantId);
  };

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
    };

    const tenantName = getTenantName(signupTenantId);

    setRegisteredUsers((previous) => ({ ...previous, [key]: newUser }));
    setReservationsByUser((previous) => ({
      ...previous,
      [key]: generateSampleReservations(tenantName, fullName),
    }));
    setAuthError(null);
    setUser(newUser);
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

  return (
    <LocalizationProvider tenantId={selectedTenantId} initialLanguage={preferredLanguage}>
      <div className="app-shell">
        <div className="app-container">
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
              <div className="app-header__domain">
                <span className="app-header__domain-label">Alan adı</span>
                <label className="domain-select">
                  <span className="sr-only">Alan adı seçimi</span>
                  <select value={selectedDomain} onChange={handleDomainChange}>
                    {domainOptions.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.host}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="app-header__domain-description">{activeDomain.description}</span>
              </div>

              <label className="tenant-select">
                <span>Tenant seçimi</span>
                <select value={selectedTenantId} onChange={handleTenantChange}>
                  {tenantOptions.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </label>

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
                    activeView={activeView === 'userHome' ? 'userReservations' : (activeView as 'userReservations' | 'userProfile' | 'userSupport')}
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

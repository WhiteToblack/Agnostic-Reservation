import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import './App.css';
import { LocalizationProvider } from './localization/LocalizationProvider';
import { LocalizationAdmin } from './localization/LocalizationAdmin';
import { LogsAdmin } from './logs/LogsAdmin';
import { NonUserDashboard } from './components/NonUserDashboard';

type TenantOption = {
  id: string;
  name: string;
};

type RegisteredUser = {
  fullName: string;
  email: string;
  password: string;
  tenantId: string;
};

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

const initialTenantId = environmentTenantId;
const preferredLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || 'tr-TR';

const createUserKey = (email: string, tenantId: string) => `${email.trim().toLowerCase()}::${tenantId}`;

type ActiveView = 'dashboard' | 'localization' | 'logs' | 'profile';

type AuthMode = 'login' | 'signup';

const App: React.FC = () => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(initialTenantId);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, RegisteredUser>>({});
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginTenantId, setLoginTenantId] = useState<string>(initialTenantId);
  const [signupTenantId, setSignupTenantId] = useState<string>(initialTenantId);
  const [showAuthPanel, setShowAuthPanel] = useState<boolean>(false);

  useEffect(() => {
    if (activeView === 'profile' && !user) {
      setActiveView('dashboard');
    }
  }, [activeView, user]);

  useEffect(() => {
    if (!user) {
      setLoginTenantId(selectedTenantId);
      setSignupTenantId(selectedTenantId);
    }
  }, [selectedTenantId, user]);

  const selectedTenantName = useMemo(() => {
    const match = tenantOptions.find((tenant) => tenant.id === selectedTenantId);
    return match?.name ?? 'Seçili tenant';
  }, [selectedTenantId]);

  const handleTenantChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTenantId(event.target.value);
  };

  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenantId(tenantId);
  };

  const handleGoToLocalization = () => {
    setActiveView('localization');
    setShowAuthPanel(false);
  };

  const handleGoToLogs = () => {
    setActiveView('logs');
    setShowAuthPanel(false);
  };

  const handleCloseAuthPanel = () => {
    setShowAuthPanel(false);
    setAuthError(null);
  };

  const handleOpenLogin = () => {
    setActiveView('dashboard');
    setAuthMode('login');
    setAuthError(null);
    setShowAuthPanel(true);
  };

  const handleOpenSignup = () => {
    setActiveView('dashboard');
    setAuthMode('signup');
    setAuthError(null);
    setShowAuthPanel(true);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthError(null);
    setAuthMode('login');
    setActiveView('dashboard');
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
    setActiveView('profile');
    setShowAuthPanel(false);
    (event.currentTarget as HTMLFormElement).reset();
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

    setRegisteredUsers((previous) => ({ ...previous, [key]: newUser }));
    setAuthError(null);
    setUser(newUser);
    setSelectedTenantId(signupTenantId);
    setActiveView('profile');
    setAuthMode('login');
    setLoginTenantId(signupTenantId);
    setShowAuthPanel(false);
    (event.currentTarget as HTMLFormElement).reset();
  };

  const dashboardLayoutClassName = [
    'dashboard-layout',
    user || showAuthPanel ? 'dashboard-layout--with-aside' : 'dashboard-layout--single',
  ].join(' ');

  return (
    <LocalizationProvider tenantId={selectedTenantId} initialLanguage={preferredLanguage}>
      <div className="app-shell">
        <div className="app-container">
          <header className="app-header">
            <div className="app-header__brand">
              <span className="app-header__title">Agnostic Reservation</span>
              <span className="app-header__subtitle">Çok kiracılı rezervasyon yönetimi</span>
            </div>

            <nav className="app-header__nav" aria-label="Temel gezinme">
              <button
                type="button"
                className={activeView === 'dashboard' ? 'app-header__nav-button app-header__nav-button--active' : 'app-header__nav-button'}
                onClick={() => setActiveView('dashboard')}
              >
                Ana sayfa
              </button>
              <button
                type="button"
                className={activeView === 'localization' ? 'app-header__nav-button app-header__nav-button--active' : 'app-header__nav-button'}
                onClick={handleGoToLocalization}
              >
                Lokalizasyon
              </button>
              <button
                type="button"
                className={activeView === 'logs' ? 'app-header__nav-button app-header__nav-button--active' : 'app-header__nav-button'}
                onClick={handleGoToLogs}
              >
                Log yönetimi
              </button>
              {user && (
                <button
                  type="button"
                  className={activeView === 'profile' ? 'app-header__nav-button app-header__nav-button--active' : 'app-header__nav-button'}
                  onClick={() => {
                    setActiveView('profile');
                    setShowAuthPanel(false);
                  }}
                >
                  Profilim
                </button>
              )}
            </nav>

            <div className="app-header__controls">
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
                        className={authMode === 'login' ? 'auth-card__tab auth-card__tab--active' : 'auth-card__tab'}
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
                        className={authMode === 'signup' ? 'auth-card__tab auth-card__tab--active' : 'auth-card__tab'}
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
                    className={activeView === 'localization' ? 'admin-layout__tab admin-layout__tab--active' : 'admin-layout__tab'}
                    onClick={() => setActiveView('localization')}
                  >
                    Lokalizasyon
                  </button>
                  <button
                    type="button"
                    className={activeView === 'logs' ? 'admin-layout__tab admin-layout__tab--active' : 'admin-layout__tab'}
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
          </main>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default App;

import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

type LayoutConfig = {
  accent: string;
  density: 'comfortable' | 'compact';
  showQuickActions: boolean;
};

type WidgetPreference = {
  id: string;
  widgetType: number;
  title: string;
  description: string;
  order: number;
  isVisible: boolean;
  config: Record<string, unknown>;
};

type ApiDashboard = {
  id: string;
  layoutConfigJson?: string | null;
};

type ApiWidget = {
  id: string;
  widgetType: number;
  order: number;
  configJson?: string | null;
};

type ApiResponse = {
  dashboard: ApiDashboard;
  widgets: ApiWidget[];
};

type Sector = {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  stats: { label: string; value: string }[];
  featuredPros: { name: string; specialty: string; availability: string }[];
};

const menuItems = [
  'Genel Bakış',
  'Rezervasyonlar',
  'Müşteri Kulübü',
  'Finans',
  'Raporlama',
  'Entegrasyonlar',
];

const widgetLibrary: Record<number, { title: string; description: string; icon: string }> = {
  0: { title: 'KPI Kartı', description: 'Gelir ve performans hedeflerinizi takip edin.', icon: '📈' },
  1: { title: 'Mini Takvim', description: 'Günün ve haftanın doluluk özetleri.', icon: '🗓️' },
  2: { title: 'Hızlı Rezervasyon', description: 'Favori hizmetleri tek tıkla planlayın.', icon: '⚡' },
  3: { title: 'Kapasite Analizi', description: 'Usta ve oda bazlı doluluk trendleri.', icon: '📊' },
  4: { title: 'Stok Uyarıları', description: 'Kritik stok seviyelerini yönetin.', icon: '📦' },
  5: { title: 'Tahsilat Durumu', description: 'Ödeme ve mutabakat akışını izleyin.', icon: '💳' },
};

const sectors: Sector[] = [
  {
    id: 'beauty',
    name: 'Güzellik & Kuaför',
    tagline: 'Şehrinizdeki en iyi salonları tek panelden yönetin.',
    accent: '#ff5f8f',
    stats: [
      { label: 'Aktif salon', value: '480+' },
      { label: 'Usta', value: '1.2K+' },
      { label: 'Anında onay', value: '%98' },
    ],
    featuredPros: [
      { name: 'Elif Yılmaz', specialty: 'Saç tasarım', availability: 'Bu hafta 6 boş saat' },
      { name: 'Deniz Kara', specialty: 'Microblading', availability: 'Yarın iki müsaitlik' },
      { name: 'Selin Aras', specialty: 'Cilt bakımı', availability: 'Öğle saatleri boş' },
    ],
  },
  {
    id: 'auto',
    name: 'Oto Servis & Detay',
    tagline: 'Periyodik bakım ve detaylı temizlik randevularını hızlandırın.',
    accent: '#4f7bff',
    stats: [
      { label: 'Yetkili servis', value: '120+' },
      { label: 'Uzman usta', value: '640+' },
      { label: 'Memnuniyet', value: '%97' },
    ],
    featuredPros: [
      { name: 'Kerem Usta', specialty: 'Motor bakım', availability: 'Bugün 15:00 sonrası' },
      { name: 'Hakan Demir', specialty: 'Detaylı temizlik', availability: 'Hafta sonu randevu' },
      { name: 'Ebru Sezer', specialty: 'Seramik kaplama', availability: '3 gün içinde boşluk' },
    ],
  },
  {
    id: 'wellness',
    name: 'Spa & Wellness',
    tagline: 'Masaj, hamam ve nefes terapisi seanslarını optimize edin.',
    accent: '#29b4a8',
    stats: [
      { label: 'Spa merkezi', value: '210+' },
      { label: 'Uzman terapist', value: '820+' },
      { label: 'Esnek iptal', value: '%94' },
    ],
    featuredPros: [
      { name: 'Mert Ay', specialty: 'Derin doku masajı', availability: 'Akşam seansları' },
      { name: 'Aslı İnce', specialty: 'Nefes terapisi', availability: 'Hafta içi sabah' },
      { name: 'Irmak Soylu', specialty: 'Spa ritüelleri', availability: 'Hafta sonu kontenjan' },
    ],
  },
];

const fallbackLayout: LayoutConfig = {
  accent: '#ff5f8f',
  density: 'comfortable',
  showQuickActions: true,
};

const fallbackWidgets: WidgetPreference[] = [
  {
    id: 'local-kpi',
    widgetType: 0,
    title: widgetLibrary[0].title,
    description: widgetLibrary[0].description,
    order: 1,
    isVisible: true,
    config: { title: 'Haftalık Gelir', trend: '+12%' },
  },
  {
    id: 'local-calendar',
    widgetType: 1,
    title: widgetLibrary[1].title,
    description: widgetLibrary[1].description,
    order: 2,
    isVisible: true,
    config: { range: 'week', occupancy: 78 },
  },
  {
    id: 'local-stock',
    widgetType: 4,
    title: widgetLibrary[4].title,
    description: widgetLibrary[4].description,
    order: 3,
    isVisible: true,
    config: { critical: 5 },
  },
  {
    id: 'local-quick',
    widgetType: 2,
    title: widgetLibrary[2].title,
    description: widgetLibrary[2].description,
    order: 4,
    isVisible: false,
    config: { shortcuts: ['Yeni müşteri', 'Seri randevu'] },
  },
];

const profile = {
  id: 'f3d1f4a4-2d53-4df1-8e52-bf0e64a314aa',
  name: 'Elif Kaya',
  title: 'Tenant Admin',
  tenantId: '6d6f1c9c-0ad5-4f10-b60e-7f32df6bce10',
  roleId: 'a2e9c38c-3cc9-4b5c-8c1c-4528371cd111',
};

const accentPalette = [
  { id: '#ff5f8f', label: 'Pembe Alev' },
  { id: '#4f7bff', label: 'Kobalt' },
  { id: '#29b4a8', label: 'Turkuaz' },
  { id: '#ff914d', label: 'Mandarin' },
  { id: '#1f2430', label: 'Gece' },
];

const parseLayout = (layoutConfigJson?: string | null): LayoutConfig => {
  if (!layoutConfigJson) {
    return fallbackLayout;
  }
  try {
    const parsed = JSON.parse(layoutConfigJson);
    return {
      accent: typeof parsed.accent === 'string' ? parsed.accent : fallbackLayout.accent,
      density: parsed.density === 'compact' ? 'compact' : 'comfortable',
      showQuickActions: parsed.showQuickActions !== false,
    };
  } catch (error) {
    console.warn('Layout parse hatası', error);
    return fallbackLayout;
  }
};

const parseWidgetConfig = (configJson?: string | null): Record<string, unknown> => {
  if (!configJson) {
    return {};
  }
  try {
    return JSON.parse(configJson);
  } catch (error) {
    console.warn('Widget config parse hatası', error);
    return {};
  }
};

const buildWidgetPreference = (widget: ApiWidget): WidgetPreference => {
  const base = widgetLibrary[widget.widgetType] ?? {
    title: 'Özel Widget',
    description: 'Yapılandırılmış pano öğesi.',
    icon: '🧩',
  };
  const config = parseWidgetConfig(widget.configJson);
  const isVisible = (typeof config.isVisible === 'boolean' ? config.isVisible : true) as boolean;
  return {
    id: widget.id,
    widgetType: widget.widgetType,
    title: base.title,
    description: base.description,
    order: widget.order,
    isVisible,
    config,
  };
};

const App: React.FC = () => {
  const [dashboardId, setDashboardId] = useState<string>('');
  const [layout, setLayout] = useState<LayoutConfig>(fallbackLayout);
  const [widgets, setWidgets] = useState<WidgetPreference[]>(fallbackWidgets);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'positive' | 'negative' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch(`/api/dashboard/user?tenantId=${profile.tenantId}&roleId=${profile.roleId}&userId=${profile.id}`);
        if (!response.ok) {
          throw new Error('Kişisel pano alınamadı');
        }
        const payload = (await response.json()) as ApiResponse;
        setDashboardId(payload.dashboard.id);
        setLayout(parseLayout(payload.dashboard.layoutConfigJson));
        setWidgets(
          payload.widgets
            .map(buildWidgetPreference)
            .sort((a, b) => a.order - b.order),
        );
        setStatusMessage(null);
      } catch (error) {
        console.info('Pano servisine erişilemedi, yerel veri kullanılacak.', error);
        setDashboardId('local-fallback');
        if (typeof window !== 'undefined') {
          try {
            const stored = window.localStorage.getItem('dashboard-preferences');
            if (stored) {
              const parsed = JSON.parse(stored) as { layout?: LayoutConfig; widgets?: WidgetPreference[] };
              if (parsed.layout) {
                setLayout(parsed.layout);
              }
              if (Array.isArray(parsed.widgets)) {
                setWidgets(parsed.widgets.slice().sort((a, b) => a.order - b.order));
              }
            }
          } catch (storageError) {
            console.warn('Yerel pano okuma hatası', storageError);
          }
        }
        setStatusTone('info');
        setStatusMessage('Canlı servis bulunamadı, kişisel düzen yerel veriler ile gösteriliyor.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const orderedWidgets = useMemo(
    () => [...widgets].sort((a, b) => a.order - b.order),
    [widgets],
  );

  const visibleWidgets = useMemo(
    () => orderedWidgets.filter((widget) => widget.isVisible),
    [orderedWidgets],
  );

  const toggleWidgetVisibility = (id: string) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === id
          ? {
              ...widget,
              isVisible: !widget.isVisible,
              config: { ...widget.config, isVisible: !widget.isVisible },
            }
          : widget,
      ),
    );
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    setWidgets((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const currentIndex = sorted.findIndex((widget) => widget.id === id);
      if (currentIndex === -1) {
        return prev;
      }
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= sorted.length) {
        return prev;
      }

      const updated = prev.map((widget) => {
        if (widget.id === sorted[currentIndex].id) {
          return { ...widget, order: sorted[swapIndex].order };
        }
        if (widget.id === sorted[swapIndex].id) {
          return { ...widget, order: sorted[currentIndex].order };
        }
        return widget;
      });

      return updated;
    });
  };

  const handleAccentChange = (accent: string) => {
    setLayout((prev) => ({ ...prev, accent }));
  };

  const handleDensityChange = (density: LayoutConfig['density']) => {
    setLayout((prev) => ({ ...prev, density }));
  };

  const handleQuickActionToggle = () => {
    setLayout((prev) => ({ ...prev, showQuickActions: !prev.showQuickActions }));
  };

  const persistLocally = (payload: { layout: LayoutConfig; widgets: WidgetPreference[] }) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem('dashboard-preferences', JSON.stringify(payload));
    } catch (error) {
      console.warn('Yerel pano yazma hatası', error);
    }
  };

  const handleSave = async () => {
    const payload = {
      layoutConfig: JSON.stringify(layout),
      widgets: orderedWidgets.map((widget) => ({
        id: widget.id,
        order: widget.order,
        configJson: JSON.stringify({ ...widget.config, isVisible: widget.isVisible }),
      })),
    };

    if (!dashboardId || dashboardId === 'local-fallback') {
      persistLocally({ layout, widgets: orderedWidgets });
      setStatusTone('positive');
      setStatusMessage('Değişiklikler tarayıcıya kaydedildi. Canlı API erişilebilir olduğunda otomatik aktarılacaktır.');
      setIsEditing(false);
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/user/${dashboardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Pano güncellenemedi');
      }

      setStatusTone('positive');
      setStatusMessage('Profil tasarımınız kaydedildi.');
      setIsEditing(false);
    } catch (error) {
      console.error('Kaydetme hatası', error);
      persistLocally({ layout, widgets: orderedWidgets });
      setStatusTone('negative');
      setStatusMessage('Sunucuya kaydedilemedi. Değişiklikler tarayıcıda saklandı.');
    }
  };

  const handleReset = () => {
    setLayout(fallbackLayout);
    setWidgets(fallbackWidgets);
    persistLocally({ layout: fallbackLayout, widgets: fallbackWidgets });
    setStatusTone('info');
    setStatusMessage('Varsayılan düzenlere döndünüz.');
  };

  return (
    <div className="app-shell" style={{ '--accent-color': layout.accent } as React.CSSProperties}>
      <div className="shell-container">
        <header className="top-nav">
          <div className="nav-left">
            <span className="brand-pill">AR</span>
            <div className="nav-links">
              {menuItems.map((item) => (
                <button key={item} className="nav-link" type="button">
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="nav-right">
            <div className="status-pulse" aria-hidden />
            <div className="profile-preview">
              <span className="profile-name">{profile.name}</span>
              <span className="profile-role">{profile.title}</span>
            </div>
            <div className="profile-avatar" aria-hidden>
              {profile.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </div>
          </div>
        </header>

        {statusMessage && (
          <div className={`status-banner status-${statusTone}`}>
            {statusMessage}
          </div>
        )}

        <main className={`dashboard-layout layout-${layout.density}`}>
          <section className="dashboard-main">
            <header className="dashboard-hero">
              <div>
                <p className="hero-overline">Hoş geldin {profile.name.split(' ')[0]}</p>
                <h1>
                  İşletmeni sana özel panodan yönet.
                  <span> Yapay zekâ destekli önerilerle planlamanı hızlandır.</span>
                </h1>
                <div className="hero-actions">
                  {layout.showQuickActions && (
                    <button type="button" className="primary-action">
                      Yeni Rezervasyon Oluştur
                    </button>
                  )}
                  <button type="button" className="secondary-action" onClick={() => setIsEditing(true)}>
                    Profil Tasarımını Düzenle
                  </button>
                </div>
              </div>
              <div className="hero-meta">
                <span className="meta-label">Kişisel Pano</span>
                <strong>{isLoading ? 'Yükleniyor...' : `${visibleWidgets.length} aktif widget`}</strong>
                <p>Her ekip üyesi için kişiselleştirilmiş görünüm sunar.</p>
              </div>
            </header>

            <section className="widget-grid">
              {visibleWidgets.map((widget) => (
                <article key={widget.id} className="widget-card">
                  <div className="widget-header">
                    <span className="widget-icon" aria-hidden>
                      {widgetLibrary[widget.widgetType]?.icon ?? '🧩'}
                    </span>
                    <div>
                      <h3>{widget.title}</h3>
                      <p>{widget.description}</p>
                    </div>
                  </div>
                  <div className="widget-body">
                    {widget.widgetType === 0 && (
                      <div className="kpi-preview">
                        <span className="kpi-value">₺128.450</span>
                        <span className="kpi-trend">{widget.config.trend ?? '+8%'} bu hafta</span>
                      </div>
                    )}
                    {widget.widgetType === 1 && (
                      <div className="calendar-preview">
                        <span className="calendar-value">%{widget.config.occupancy ?? 76} doluluk</span>
                        <small>{(widget.config.range as string) ?? 'week'} görünümü</small>
                      </div>
                    )}
                    {widget.widgetType === 2 && (
                      <ul className="quick-links">
                        {Array.isArray(widget.config.shortcuts)
                          ? (widget.config.shortcuts as string[]).map((shortcut) => <li key={shortcut}>{shortcut}</li>)
                          : ['VIP müşteri', 'Yeni kampanya'].map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    )}
                    {widget.widgetType === 4 && (
                      <div className="stock-preview">
                        <span>Kritik stok adedi: {widget.config.critical ?? 4}</span>
                        <small>Otomatik sipariş hatırlatması açık</small>
                      </div>
                    )}
                    {[0, 1, 2, 4].indexOf(widget.widgetType) === -1 && (
                      <p className="widget-generic">Bu widget için özel görünüm yakında.</p>
                    )}
                  </div>
                </article>
              ))}
            </section>

            <section className="sector-showcase">
              <header className="section-header">
                <h2>Sektör bazlı hazır şablonlar</h2>
                <p>Ekibine uygun temayı seç, kişisel dokunuşla tamamla.</p>
              </header>
              <div className="sector-grid">
                {sectors.map((sector) => (
                  <article key={sector.id} className="sector-card">
                    <div className="sector-header" style={{ borderColor: sector.accent }}>
                      <h3>{sector.name}</h3>
                      <p>{sector.tagline}</p>
                    </div>
                    <div className="sector-stats">
                      {sector.stats.map((stat) => (
                        <div key={stat.label}>
                          <span className="stat-value">{stat.value}</span>
                          <span className="stat-label">{stat.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="sector-pros">
                      {sector.featuredPros.map((pro) => (
                        <div key={pro.name} className="pro-item">
                          <strong>{pro.name}</strong>
                          <span>{pro.specialty}</span>
                          <small>{pro.availability}</small>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="ghost-button">
                      Bu şablonu uygula
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <aside className={`customizer-panel ${isEditing ? 'open' : ''}`}>
            <header className="customizer-header">
              <div>
                <h2>Profil Tasarımı</h2>
                <p>Pano düzenini sana göre ayarla ve kaydet.</p>
              </div>
              <button type="button" className="close-button" onClick={() => setIsEditing(false)}>
                Kapat
              </button>
            </header>

            <div className="customizer-body">
              <section>
                <h3>Renk paleti</h3>
                <div className="accent-grid">
                  {accentPalette.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`accent-swatch ${layout.accent === option.id ? 'selected' : ''}`}
                      style={{ background: option.id }}
                      onClick={() => handleAccentChange(option.id)}
                    >
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3>Yoğunluk</h3>
                <div className="density-toggle">
                  <button
                    type="button"
                    className={layout.density === 'comfortable' ? 'active' : ''}
                    onClick={() => handleDensityChange('comfortable')}
                  >
                    Rahat
                  </button>
                  <button
                    type="button"
                    className={layout.density === 'compact' ? 'active' : ''}
                    onClick={() => handleDensityChange('compact')}
                  >
                    Sıkı
                  </button>
                </div>
                <label className="toggle-row">
                  <input type="checkbox" checked={layout.showQuickActions} onChange={handleQuickActionToggle} />
                  Hızlı aksiyon butonlarını göster
                </label>
              </section>

              <section>
                <h3>Widgetlar</h3>
                <ul className="widget-preference-list">
                  {orderedWidgets.map((widget, index) => (
                    <li key={widget.id}>
                      <div>
                        <strong>{widget.title}</strong>
                        <span>{widget.description}</span>
                      </div>
                      <div className="widget-controls">
                        <button type="button" onClick={() => moveWidget(widget.id, 'up')} disabled={index === 0}>
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveWidget(widget.id, 'down')}
                          disabled={index === orderedWidgets.length - 1}
                        >
                          ↓
                        </button>
                        <label className="toggle-row">
                          <input type="checkbox" checked={widget.isVisible} onChange={() => toggleWidgetVisibility(widget.id)} />
                          Göster
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <footer className="customizer-footer">
              <button type="button" className="ghost-button" onClick={handleReset}>
                Varsayılana dön
              </button>
              <button type="button" className="primary-action" onClick={handleSave}>
                Kaydet ve uygula
              </button>
            </footer>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default App;

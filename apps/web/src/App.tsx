import React, { useMemo, useState } from 'react';
import './App.css';

type Sector = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  gradient: string;
  stats: { label: string; value: string }[];
  popularServices: string[];
  quickFilters: string[];
  featuredPros: { name: string; specialty: string; rating: number; availability: string }[];
};

type Business = {
  id: string;
  sectorId: string;
  name: string;
  shopType: string;
  neighborhood: string;
  rating: number;
  reviewCount: number;
  masters: string[];
  tags: string[];
};

type SearchState = {
  sectorId: string;
  shop: string;
  pro: string;
};

const sectors: Sector[] = [
  {
    id: 'beauty',
    name: 'Güzellik & Kuaför',
    tagline: 'Şehrinizdeki en iyi salonlar ve uzman kuaförler tek platformda.',
    description: 'Saç kesimi, renklendirme, cilt bakımı ve daha fazlası için dakikalar içinde randevu oluşturun.',
    accent: '#ff5f8f',
    gradient: 'linear-gradient(135deg, #ff8fa3 0%, #ff5f8f 50%, #f0487f 100%)',
    stats: [
      { label: 'Aktif salon', value: '480+' },
      { label: 'Usta', value: '1.2K+' },
      { label: 'Anında onay', value: '%98' },
    ],
    popularServices: ['Saç kesimi', 'Cilt bakımı', 'Microblading', 'Jel manikür'],
    quickFilters: ['Saç kesimi', 'Cilt bakımı', 'Jel manikür'],
    featuredPros: [
      { name: 'Elif Yılmaz', specialty: 'Saç tasarım', rating: 4.9, availability: 'Bu hafta 6 boş saat' },
      { name: 'Deniz Kara', specialty: 'Microblading', rating: 4.8, availability: 'Yarın iki müsaitlik' },
      { name: 'Selin Aras', specialty: 'Cilt bakımı', rating: 5.0, availability: 'Öğle saatleri boş' },
    ],
  },
  {
    id: 'auto',
    name: 'Oto Servis & Detay',
    tagline: 'Güvenilir servisler ile aracınızı zamanında teslim alın.',
    description: 'Periyodik bakım, kaporta, boyasız göçük ve detaylı temizlik için en yakın ustayı bulun.',
    accent: '#4f7bff',
    gradient: 'linear-gradient(135deg, #8ea6ff 0%, #4f7bff 55%, #3055ff 100%)',
    stats: [
      { label: 'Yetkili servis', value: '120+' },
      { label: 'Uzman usta', value: '640+' },
      { label: 'Memnuniyet', value: '%97' },
    ],
    popularServices: ['Periyodik bakım', 'Detaylı temizlik', 'Boyasız göçük', 'Seramik kaplama'],
    quickFilters: ['Periyodik bakım', 'Detaylı temizlik', 'Elektrikli araç'],
    featuredPros: [
      { name: 'Kerem Usta', specialty: 'Motor bakım', rating: 4.9, availability: 'Bugün 15:00 sonrası' },
      { name: 'Hakan Demir', specialty: 'Detaylı temizlik', rating: 4.7, availability: 'Hafta sonu randevu' },
      { name: 'Ebru Sezer', specialty: 'Seramik kaplama', rating: 4.8, availability: '3 gün içinde boşluk' },
    ],
  },
  {
    id: 'wellness',
    name: 'Spa & Wellness',
    tagline: 'Rahatlama ve yenilenme için size uygun spa deneyimini seçin.',
    description: 'Masaj, hamam, yoga ve nefes terapisi gibi hizmetlerde en uygun saatleri yakalayın.',
    accent: '#29b4a8',
    gradient: 'linear-gradient(135deg, #74e4cf 0%, #29b4a8 55%, #1f8d85 100%)',
    stats: [
      { label: 'Spa merkezi', value: '210+' },
      { label: 'Uzman terapist', value: '820+' },
      { label: 'Esnek iptal', value: '%94' },
    ],
    popularServices: ['Derin doku masajı', 'Hamam ritüeli', 'Yoga seansı', 'Nefes terapisi'],
    quickFilters: ['Derin doku masajı', 'Yoga seansı', 'Hamam ritüeli'],
    featuredPros: [
      { name: 'Mert Ay', specialty: 'Derin doku masajı', rating: 4.9, availability: 'Akşam seansları' },
      { name: 'Aslı İnce', specialty: 'Nefes terapisi', rating: 4.8, availability: 'Hafta içi sabah' },
      { name: 'Irmak Soylu', specialty: 'Spa ritüelleri', rating: 5.0, availability: 'Hafta sonu kontenjan' },
    ],
  },
  {
    id: 'home',
    name: 'Ev Bakım & Temizlik',
    tagline: 'Temizlikten tadilata tüm ihtiyaçlarınız için doğru ekipleri bulun.',
    description: 'Periyodik temizlik, boya, tesisat ve akıllı ev kurulumu için profesyonellerle eşleşin.',
    accent: '#ff914d',
    gradient: 'linear-gradient(135deg, #ffc48a 0%, #ff914d 55%, #f46a2b 100%)',
    stats: [
      { label: 'Hizmet sağlayıcı', value: '560+' },
      { label: 'Uzman ekip', value: '1.1K+' },
      { label: 'Tekrar tercih', value: '%92' },
    ],
    popularServices: ['Derin temizlik', 'Tadilat', 'Tesisat', 'Akıllı ev kurulumu'],
    quickFilters: ['Derin temizlik', 'Tadilat', 'Tesisat'],
    featuredPros: [
      { name: 'Ayşe Tesisat', specialty: 'Tesisat çözümleri', rating: 4.8, availability: '48 saat içinde' },
      { name: 'Usta Boyacı', specialty: 'Boya & badana', rating: 4.7, availability: 'Önümüzdeki hafta' },
      { name: 'Parıltı Ekip', specialty: 'Derin temizlik', rating: 4.9, availability: 'Her gün 3 seans' },
    ],
  },
];

const businesses: Business[] = [
  {
    id: 'atelier-nova',
    sectorId: 'beauty',
    name: 'Atelier Nova',
    shopType: 'Kuaför & Güzellik Salonu',
    neighborhood: 'Nişantaşı',
    rating: 4.9,
    reviewCount: 214,
    masters: ['Elif Yılmaz', 'Deniz Kara'],
    tags: ['saç kesimi', 'renklendirme', 'nişantaşı', 'kuaför'],
  },
  {
    id: 'luna-beauty',
    sectorId: 'beauty',
    name: 'Luna Beauty Lab',
    shopType: 'Cilt Bakım Stüdyosu',
    neighborhood: 'Moda',
    rating: 4.8,
    reviewCount: 156,
    masters: ['Selin Aras'],
    tags: ['cilt bakımı', 'leke tedavisi', 'moda'],
  },
  {
    id: 'miracle-nails',
    sectorId: 'beauty',
    name: 'Miracle Nails',
    shopType: 'Manikür & Pedikür Stüdyosu',
    neighborhood: 'Bakırköy',
    rating: 4.7,
    reviewCount: 198,
    masters: ['Asya Koç', 'Eylül Güneş'],
    tags: ['jel manikür', 'pedikür', 'bakırköy'],
  },
  {
    id: 'detay-garage',
    sectorId: 'auto',
    name: 'Detay Garage',
    shopType: 'Oto Detay & Seramik Kaplama',
    neighborhood: 'Maslak',
    rating: 4.8,
    reviewCount: 301,
    masters: ['Hakan Demir'],
    tags: ['detaylı temizlik', 'seramik kaplama', 'maslak'],
  },
  {
    id: 'ustam-oto',
    sectorId: 'auto',
    name: 'Ustam Oto Servis',
    shopType: 'Yetkili Servis',
    neighborhood: 'Kartal',
    rating: 4.9,
    reviewCount: 420,
    masters: ['Kerem Usta', 'Ebru Sezer'],
    tags: ['periyodik bakım', 'kartal', 'mekanik'],
  },
  {
    id: 'volt-ev',
    sectorId: 'auto',
    name: 'VoltEV Servis',
    shopType: 'Elektrikli Araç Servisi',
    neighborhood: 'Ataşehir',
    rating: 4.6,
    reviewCount: 88,
    masters: ['Selçuk Tek'],
    tags: ['elektrikli araç', 'batarya', 'ataşehir'],
  },
  {
    id: 'zen-spa',
    sectorId: 'wellness',
    name: 'Zenline Spa',
    shopType: 'Spa & Masaj Merkezi',
    neighborhood: 'Beşiktaş',
    rating: 4.9,
    reviewCount: 264,
    masters: ['Mert Ay'],
    tags: ['derin doku masajı', 'beşiktaş', 'spa'],
  },
  {
    id: 'breath-lab',
    sectorId: 'wellness',
    name: 'Breath Lab',
    shopType: 'Nefes & Yoga Stüdyosu',
    neighborhood: 'Caddebostan',
    rating: 4.8,
    reviewCount: 112,
    masters: ['Aslı İnce'],
    tags: ['nefes terapisi', 'yoga', 'caddebostan'],
  },
  {
    id: 'forest-retreat',
    sectorId: 'wellness',
    name: 'Forest Retreat',
    shopType: 'Doğa Spa Deneyimi',
    neighborhood: 'Polonezköy',
    rating: 5.0,
    reviewCount: 76,
    masters: ['Irmak Soylu'],
    tags: ['doğa içi', 'hamam', 'spa'],
  },
  {
    id: 'prizma-temizlik',
    sectorId: 'home',
    name: 'Prizma Profesyonel',
    shopType: 'Temizlik Ekibi',
    neighborhood: 'Ümraniye',
    rating: 4.9,
    reviewCount: 198,
    masters: ['Parıltı Ekip'],
    tags: ['derin temizlik', 'ümraniye', 'ev temizliği'],
  },
  {
    id: 'usta-boya',
    sectorId: 'home',
    name: 'Usta Boya Atölyesi',
    shopType: 'Boya & Dekorasyon',
    neighborhood: 'Kadıköy',
    rating: 4.7,
    reviewCount: 142,
    masters: ['Usta Boyacı'],
    tags: ['boya', 'tadilat', 'kadıköy'],
  },
  {
    id: 'akilli-ev',
    sectorId: 'home',
    name: 'Akıllı Ev Atölyesi',
    shopType: 'Teknoloji & Tesisat',
    neighborhood: 'Çekmeköy',
    rating: 4.8,
    reviewCount: 96,
    masters: ['Ayşe Tesisat'],
    tags: ['akıllı ev', 'tesisat', 'çekmeköy'],
  },
];

const quickShortcuts: (SearchState & { label: string })[] = [
  { label: 'Nişantaşı kuaför', sectorId: 'beauty', shop: 'Nişantaşı', pro: '' },
  { label: 'Detaylı oto temizlik', sectorId: 'auto', shop: 'detaylı temizlik', pro: '' },
  { label: 'Yoga terapisti', sectorId: 'wellness', shop: 'yoga', pro: '' },
  { label: 'Sigortalı temizlik ekibi', sectorId: 'home', shop: 'temizlik', pro: '' },
];

const LandingView: React.FC<{
  search: SearchState;
  onChange: (state: SearchState) => void;
  onSearch: (criteria: SearchState) => void;
  results: Business[];
  showResults: boolean;
  onSelectSector: (sectorId: string) => void;
}> = ({ search, onChange, onSearch, results, showResults, onSelectSector }) => {
  const updateField = (field: keyof SearchState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({ ...search, [field]: event.target.value });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(search);
  };

  return (
    <div className="landing-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Randevunuzu saniyeler içinde oluşturun</h1>
          <p>
            Kolay Randevu deneyimini temel alan bu tasarım; sektör, dükkan ve usta aramalarını aynı yerde birleştirir. İlk adımda
            sektörünüzü seçin, devamında size özel filtrelerle aramanızı derinleştirin.
          </p>
          <div className="hero-pills">
            <span className="pill">Gerçek zamanlı müsaitlik</span>
            <span className="pill">Konuma göre öneriler</span>
            <span className="pill">Onaylanan ustalar</span>
          </div>
        </div>
        <div className="search-card">
          <header>
            <h2>Aramanızı başlatın</h2>
            <small style={{ color: 'rgba(11, 28, 54, 0.6)' }}>Sadece sektör seçerseniz, size özel sayfaya yönlendiririz.</small>
          </header>
          <form className="search-form" onSubmit={handleSubmit}>
            <div className="search-row">
              <label>
                Sektör seçin
                <select value={search.sectorId} onChange={updateField('sectorId')}>
                  <option value="">Sektör</option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dükkan veya hizmet
                <input
                  type="text"
                  placeholder="Örn. manikür, periyodik bakım"
                  value={search.shop}
                  onChange={updateField('shop')}
                />
              </label>
              <label>
                Usta adı
                <input
                  type="text"
                  placeholder="Örn. Kerem Usta"
                  value={search.pro}
                  onChange={updateField('pro')}
                />
              </label>
            </div>
            <button type="submit" className="primary-button">
              Uygun randevuları bul
            </button>
          </form>
          <div className="quick-searches">
            {quickShortcuts.map(({ label, ...criteria }) => (
              <button key={label} onClick={() => onSearch(criteria)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="sector-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Popüler sektörlere göz atın</h2>
          <span style={{ color: 'rgba(11, 28, 54, 0.6)', fontSize: '0.95rem' }}>Sektör seçmek sizi özel arayüze götürür.</span>
        </div>
        <div className="sector-grid">
          {sectors.map((sector) => (
            <article
              key={sector.id}
              className="sector-card"
              style={{ '--card-gradient': sector.gradient } as React.CSSProperties}
              onClick={() => onSelectSector(sector.id)}
            >
              <strong>{sector.name}</strong>
              <p>{sector.description}</p>
              <span>{sector.stats[0]?.value} aktif işletme</span>
            </article>
          ))}
        </div>
      </section>

      {showResults && (
        <section className="results-section">
          <h3>Arama sonuçları</h3>
          {results.length === 0 ? (
            <p style={{ color: 'rgba(11, 28, 54, 0.6)' }}>
              Aradığınız kriterlere uygun işletme bulamadık. Sadece sektör seçerek ilgili deneyime geçebilirsiniz.
            </p>
          ) : (
            <div className="result-grid">
              {results.map((business) => (
                <div key={business.id} className="result-card">
                  <h4>{business.name}</h4>
                  <div className="result-meta">
                    <span>{business.shopType}</span>
                    <span>
                      ⭐ {business.rating.toFixed(1)} ({business.reviewCount})
                    </span>
                  </div>
                  <div className="result-meta">
                    <span>{business.neighborhood}</span>
                    <span>{business.masters.join(', ')}</span>
                  </div>
                  <div className="tag-list">
                    {business.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

const SectorExperience: React.FC<{
  sector: Sector;
  businesses: Business[];
  onBack: () => void;
}> = ({ sector, businesses, onBack }) => {
  const [filters, setFilters] = useState({ service: '', location: '', date: '', master: '' });

  const filteredBusinesses = useMemo(() => {
    const serviceTerm = filters.service.trim().toLowerCase();
    const locationTerm = filters.location.trim().toLowerCase();
    const masterTerm = filters.master.trim().toLowerCase();

    return businesses.filter((business) => {
      const matchesService = !serviceTerm || business.tags.some((tag) => tag.includes(serviceTerm));
      const matchesLocation = !locationTerm || business.neighborhood.toLowerCase().includes(locationTerm);
      const matchesMaster = !masterTerm || business.masters.some((name) => name.toLowerCase().includes(masterTerm));
      return matchesService && matchesLocation && matchesMaster;
    });
  }, [businesses, filters]);

  const displayedBusinesses = filteredBusinesses.slice(0, 3);

  const updateFilter = (field: keyof typeof filters) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <div className="sector-page" style={{ '--accent-color': sector.accent } as React.CSSProperties}>
      <button className="back-button" onClick={onBack}>
        ← Tüm sektörlere dön
      </button>

      <section className="sector-hero" style={{ background: sector.gradient }}>
        <div>
          <h1>{sector.name}</h1>
          <p>{sector.tagline}</p>
          <div className="hero-pills" style={{ marginTop: 16 }}>
            {sector.quickFilters.map((filter) => (
              <span key={filter} className="pill" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>
                {filter}
              </span>
            ))}
          </div>
        </div>
        <div className="sector-hero-stats">
          {sector.stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <form className="sector-search-panel" onSubmit={(event) => event.preventDefault()}>
        <h2>{sector.name} için aramanızı özelleştirin</h2>
        <div className="filter-row">
          <label>
            Hizmet türü
            <select value={filters.service} onChange={updateFilter('service')}>
              <option value="">Tümü</option>
              {sector.popularServices.map((service) => (
                <option key={service} value={service.toLowerCase()}>
                  {service}
                </option>
              ))}
            </select>
          </label>
          <label>
            Lokasyon veya semt
            <input
              type="text"
              placeholder="Örn. Kadıköy, Maslak"
              value={filters.location}
              onChange={updateFilter('location')}
            />
          </label>
          <label>
            Usta adı
            <input type="text" placeholder="Favori ustanız" value={filters.master} onChange={updateFilter('master')} />
          </label>
          <label>
            Tarih
            <input type="date" value={filters.date} onChange={updateFilter('date')} />
          </label>
        </div>
        <div className="filter-actions">
          <div className="quick-filter-group">
            {sector.quickFilters.map((filter) => (
              <button key={filter} type="button" onClick={() => setFilters((prev) => ({ ...prev, service: filter.toLowerCase() }))}>
                {filter}
              </button>
            ))}
          </div>
          <span style={{ color: 'rgba(11, 28, 54, 0.6)', fontSize: '0.9rem' }}>
            {filteredBusinesses.length} işletme kriterlerinize uyuyor
          </span>
        </div>
        <button type="submit" className="primary-button">
          Uygun saatleri göster
        </button>
      </form>

      <section className="featured-section">
        <article className="feature-card">
          <h2>Popüler hizmetler</h2>
          <ul>
            {sector.popularServices.map((service) => (
              <li key={service}>
                {service}
                <span className="rating">★</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="feature-card">
          <h2>Öne çıkan ustalar</h2>
          <ul>
            {sector.featuredPros.map((pro) => (
              <li key={pro.name}>
                <span className="pro-chip">
                  {pro.name}
                  <span style={{ color: 'rgba(11, 28, 54, 0.6)' }}>{pro.specialty}</span>
                </span>
                <span>
                  <span className="rating">{pro.rating.toFixed(1)}</span> · {pro.availability}
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className="feature-card">
          <h2>Size yakın işletmeler</h2>
          <ul>
            {displayedBusinesses.map((business) => (
              <li key={business.id}>
                <span className="pro-chip">
                  {business.name}
                  <span style={{ color: 'rgba(11, 28, 54, 0.6)' }}>{business.neighborhood}</span>
                </span>
                <span className="rating">⭐ {business.rating.toFixed(1)}</span>
              </li>
            ))}
            {displayedBusinesses.length === 0 && <li>Filtrelerinizi genişleterek daha fazla işletme görüntüleyin.</li>}
          </ul>
        </article>
      </section>
    </div>
  );
};

const App: React.FC = () => {
  const [search, setSearch] = useState<SearchState>({ sectorId: '', shop: '', pro: '' });
  const [results, setResults] = useState<Business[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [view, setView] = useState<'landing' | 'sector'>('landing');
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);

  const runSearch = (criteria: SearchState) => {
    const sectorId = criteria.sectorId.trim();
    const shopTerm = criteria.shop.trim().toLowerCase();
    const proTerm = criteria.pro.trim().toLowerCase();

    if (sectorId && !shopTerm && !proTerm) {
      setSelectedSectorId(sectorId);
      setView('sector');
      setShowResults(false);
      return;
    }

    const filtered = businesses.filter((business) => {
      const matchesSector = !sectorId || business.sectorId === sectorId;
      const matchesShop =
        !shopTerm ||
        business.name.toLowerCase().includes(shopTerm) ||
        business.shopType.toLowerCase().includes(shopTerm) ||
        business.tags.some((tag) => tag.includes(shopTerm));
      const matchesPro =
        !proTerm || business.masters.some((master) => master.toLowerCase().includes(proTerm));

      return matchesSector && matchesShop && matchesPro;
    });

    setResults(filtered);
    setShowResults(true);
    setSelectedSectorId(sectorId || null);
    setView('landing');
  };

  const handleSearch = (criteria: SearchState) => {
    setSearch({ sectorId: criteria.sectorId, shop: criteria.shop, pro: criteria.pro });
    runSearch(criteria);
  };

  const handleSelectSector = (sectorId: string) => {
    setSearch((prev) => ({ ...prev, sectorId }));
    setSelectedSectorId(sectorId);
    setView('sector');
    setShowResults(false);
  };

  const selectedSector = useMemo(() => sectors.find((sector) => sector.id === selectedSectorId) ?? null, [selectedSectorId]);
  const sectorBusinesses = useMemo(
    () => businesses.filter((business) => business.sectorId === selectedSectorId),
    [selectedSectorId],
  );

  if (view === 'sector' && selectedSector) {
    return <SectorExperience sector={selectedSector} businesses={sectorBusinesses} onBack={() => setView('landing')} />;
  }

  return (
    <div className="app-shell">
      <LandingView
        search={search}
        onChange={setSearch}
        onSearch={handleSearch}
        results={results}
        showResults={showResults}
        onSelectSector={handleSelectSector}
      />
    </div>
  );
};

export default App;

import React, { useMemo } from 'react';

type CompanyDashboardView = 'companyOverview' | 'companyReservations' | 'companyOperations';

type CompanyDashboardProps = {
  tenantName: string;
  activeView: CompanyDashboardView;
};

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ tenantName, activeView }) => {
  const stats = useMemo(
    () => [
      { label: 'Aktif rezervasyon', value: '428', trend: '+12% son 7 gün' },
      { label: 'Ortalama doluluk', value: '87%', trend: '+5% hafta bazlı' },
      { label: 'Ortalama günlük ücret', value: '₺3.450', trend: '+8% gelir artışı' },
      { label: 'İptal oranı', value: '%4,2', trend: '-3% iyileşme' },
    ],
    []
  );

  const upcomingArrivals = useMemo(
    () => [
      {
        id: 'AR-4821',
        guest: 'Ayşe Yılmaz',
        checkIn: '12 Nisan, Cuma',
        nights: 3,
        room: 'Deluxe Oda',
        channel: 'Expedia',
      },
      {
        id: 'AR-4825',
        guest: 'Mert Cengiz',
        checkIn: '13 Nisan, Cumartesi',
        nights: 2,
        room: 'Executive Süit',
        channel: 'Doğrudan',
      },
      {
        id: 'AR-4829',
        guest: 'Seda Güneş',
        checkIn: '14 Nisan, Pazar',
        nights: 5,
        room: 'Aile Odası',
        channel: 'Booking.com',
      },
    ],
    []
  );

  const occupancyByProperty = useMemo(
    () => [
      { property: 'Taksim Flagship', occupancy: 92, trend: '+6%' },
      { property: 'Galata Suites', occupancy: 84, trend: '+4%' },
      { property: 'Bodrum Marina', occupancy: 78, trend: '+2%' },
      { property: 'Kapadokya Taş Konak', occupancy: 88, trend: '+7%' },
    ],
    []
  );

  const revenueStreams = useMemo(
    () => [
      { channel: 'Doğrudan satış', value: '₺1,2M', share: '%41' },
      { channel: 'OTA kanalları', value: '₺950K', share: '%33' },
      { channel: 'Kurumsal anlaşmalar', value: '₺620K', share: '%21' },
      { channel: 'Uzun dönem', value: '₺180K', share: '%5' },
    ],
    []
  );

  const reservationPipeline = useMemo(
    () => [
      { title: 'Yeni Talepler', count: 38, description: 'Kanallardan düşen ve teyit bekleyen rezervasyon talepleri.' },
      { title: 'Onay Bekleyen', count: 21, description: 'Ön provizyon alınmış, tarih teyidi beklenen kayıtlar.' },
      { title: 'Ödemesi Alınan', count: 294, description: 'Tamamlanan rezervasyonlar, otele aktarım bekliyor.' },
      { title: 'İptal İncelemesi', count: 9, description: 'İade ve politika kontrolü gereken talepler.' },
    ],
    []
  );

  const operationsBoard = useMemo(
    () => [
      {
        title: 'Günlük yapılacaklar',
        items: [
          'Saat 14:00 housekeeping turu ve oda teslim kontrolleri',
          'Kurumsal müşteri check-in süreci için shuttle koordinasyonu',
          'Spa & wellness kampanyasının satış ekibiyle paylaşımı',
        ],
      },
      {
        title: 'Servis iyileştirme',
        items: [
          'Oda minibar stoklarının dijital kayıtlarla eşleştirilmesi',
          'Gece vardiyası personel planlamasının güncellenmesi',
          'Misafir sadakat programı için yeni segment önerileri',
        ],
      },
    ],
    []
  );

  const financeSummary = useMemo(
    () => ({
      thisWeek: '₺2,48M toplam gelir',
      adr: '₺3.450 ortalama günlük ücret',
      revPar: '₺2.987 RevPAR',
      forecast: 'Önümüzdeki 30 gün için %91 doluluk öngörülüyor.',
    }),
    []
  );

  const supportTickets = useMemo(
    () => [
      { id: 'ST-194', topic: 'PMS entegrasyon sorusu', status: 'Açık', owner: 'Operasyon' },
      { id: 'ST-188', topic: 'Bodrum tesisi bakım planı', status: 'Yanıtlandı', owner: 'Teknik' },
      { id: 'ST-176', topic: 'Yeni satış kanalı aktivasyonu', status: 'Devam ediyor', owner: 'Satış' },
    ],
    []
  );

  return (
    <section className="company-dashboard">
      <header className="company-dashboard__header">
        <div>
          <span className="company-dashboard__badge">{tenantName} şirket portalı</span>
          <h1>Agnostic Reservation şirket paneli ile tüm operasyonu tek ekranda yönetin</h1>
          <p>
            Rezervasyon akışı, gelir performansı ve ekip operasyonlarını merkezi olarak izleyin. Çok kiracılı yapı sayesinde
            tüm tesislerinizi tek oturumda kontrol edin.
          </p>
        </div>
        <div className="company-dashboard__helper">
          <strong>Alan adı:</strong>
          <span>company.agnostic.com</span>
          <p>Bu görünüm, tesis yönetim ekiplerine özel olarak tasarlanmıştır.</p>
        </div>
      </header>

      {activeView === 'companyOverview' && (
        <>
          <div className="company-dashboard__metrics">
            {stats.map((stat) => (
              <article key={stat.label} className="company-dashboard__metric">
                <span className="company-dashboard__metric-label">{stat.label}</span>
                <strong>{stat.value}</strong>
                <span className="company-dashboard__metric-trend">{stat.trend}</span>
              </article>
            ))}
          </div>

          <div className="company-dashboard__grid">
            <article className="company-dashboard__card">
              <header>
                <h2>Yaklaşan check-in listesi</h2>
                <p>Önümüzdeki 72 saat içerisinde karşılanacak misafirler</p>
              </header>
              <ul className="company-dashboard__list">
                {upcomingArrivals.map((arrival) => (
                  <li key={arrival.id}>
                    <div>
                      <strong>{arrival.guest}</strong>
                      <span>{arrival.room}</span>
                    </div>
                    <div>
                      <span>{arrival.checkIn}</span>
                      <span>{arrival.channel}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article className="company-dashboard__card">
              <header>
                <h2>Tesis bazlı doluluk</h2>
                <p>Son 7 günlük doluluk ve trend takibi</p>
              </header>
              <ul className="company-dashboard__list company-dashboard__list--two-column">
                {occupancyByProperty.map((property) => (
                  <li key={property.property}>
                    <div>
                      <strong>{property.property}</strong>
                      <span>Doluluk</span>
                    </div>
                    <div>
                      <span className="company-dashboard__value">%{property.occupancy}</span>
                      <span className="company-dashboard__trend">{property.trend}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="company-dashboard__grid company-dashboard__grid--balanced">
            <article className="company-dashboard__card">
              <header>
                <h2>Gelir kanalları</h2>
                <p>Kaynak bazlı gelir dağılımı</p>
              </header>
              <ul className="company-dashboard__list">
                {revenueStreams.map((stream) => (
                  <li key={stream.channel}>
                    <div>
                      <strong>{stream.channel}</strong>
                      <span>Gelir</span>
                    </div>
                    <div>
                      <span className="company-dashboard__value">{stream.value}</span>
                      <span className="company-dashboard__trend">Pay: {stream.share}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article className="company-dashboard__card">
              <header>
                <h2>Finans özeti</h2>
                <p>Haftalık performans metrikleri</p>
              </header>
              <dl className="company-dashboard__definition-list">
                <div>
                  <dt>Toplam gelir</dt>
                  <dd>{financeSummary.thisWeek}</dd>
                </div>
                <div>
                  <dt>ADR</dt>
                  <dd>{financeSummary.adr}</dd>
                </div>
                <div>
                  <dt>RevPAR</dt>
                  <dd>{financeSummary.revPar}</dd>
                </div>
                <div>
                  <dt>30 günlük tahmin</dt>
                  <dd>{financeSummary.forecast}</dd>
                </div>
              </dl>
            </article>
          </div>
        </>
      )}

      {activeView === 'companyReservations' && (
        <div className="company-dashboard__grid company-dashboard__grid--triple">
          {reservationPipeline.map((stage) => (
            <article key={stage.title} className="company-dashboard__card">
              <header>
                <h2>{stage.title}</h2>
                <p>Aktif kayıt: {stage.count}</p>
              </header>
              <p>{stage.description}</p>
              <button type="button" className="company-dashboard__action">
                Detaylı kuyruğu aç
              </button>
            </article>
          ))}
          <article className="company-dashboard__card">
            <header>
              <h2>Destek talepleri</h2>
              <p>Merkezi ekipten bekleyen işler</p>
            </header>
            <ul className="company-dashboard__list">
              {supportTickets.map((ticket) => (
                <li key={ticket.id}>
                  <div>
                    <strong>{ticket.topic}</strong>
                    <span>{ticket.id}</span>
                  </div>
                  <div>
                    <span className="company-dashboard__value">{ticket.status}</span>
                    <span className="company-dashboard__trend">{ticket.owner}</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      )}

      {activeView === 'companyOperations' && (
        <div className="company-dashboard__grid company-dashboard__grid--balanced">
          {operationsBoard.map((board) => (
            <article key={board.title} className="company-dashboard__card">
              <header>
                <h2>{board.title}</h2>
                <p>Operasyon ekibi ile paylaşılan ajanda</p>
              </header>
              <ul className="company-dashboard__bullets">
                {board.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}

          <article className="company-dashboard__card company-dashboard__card--highlight">
            <header>
              <h2>Operasyon özeti</h2>
              <p>Aksiyon gerektiren kritik başlıklar</p>
            </header>
            <ul className="company-dashboard__bullets">
              <li>Housekeeping vardiyasında 4 boş pozisyon, geçici atama yapıldı.</li>
              <li>Kurumsal müşteri check-out süreçlerinde otomatik faturalama aktif edildi.</li>
              <li>Misafir memnuniyet anketlerinde %92 puan ile haftalık rekor kırıldı.</li>
            </ul>
            <button type="button" className="company-dashboard__action">
              Operasyon raporunu indir
            </button>
          </article>
        </div>
      )}
    </section>
  );
};

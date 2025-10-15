import React from 'react';

type NonUserDashboardProps = {
  selectedTenantName: string;
  tenantOptions: { id: string; name: string }[];
  selectedTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  onExploreLocalization: () => void;
  onExploreLogs: () => void;
  onLogin: () => void;
  onSignup: () => void;
};

export const NonUserDashboard: React.FC<NonUserDashboardProps> = ({
  selectedTenantName,
  tenantOptions = [],
  selectedTenantId,
  onSelectTenant,
  onExploreLocalization,
  onExploreLogs,
  onLogin,
  onSignup,
}) => {
  const hasTenantOptions = tenantOptions.length > 0;

  return (
    <section className="non-user-dashboard">
      <header className="non-user-dashboard__hero">
        <div>
          <span className="non-user-dashboard__badge">Çok kiracılı rezervasyon platformu</span>
          <h1>
            Agnostic Reservation ile {selectedTenantName} işletmenizi tek panelden yönetin
          </h1>
          <p>
            Lokasyon ve kanal bağımsız çalışan platformumuz sayesinde, içerik çevirilerinden operasyon loglarına kadar tüm
            süreçleri merkezi olarak yönetebilir, ekiplerinizi tek bir dijital oturumda buluşturabilirsiniz.
          </p>
          <div className="non-user-dashboard__tenant-picker">
            <label>
              <span>Tenant seçimi</span>
              <select
                value={selectedTenantId}
                onChange={(event) => onSelectTenant(event.target.value)}
                disabled={!hasTenantOptions}
              >
                {hasTenantOptions ? (
                  tenantOptions.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))
                ) : (
                  <option value="">Tenant bulunamadı</option>
                )}
              </select>
            </label>
            <p>Seçili tenant: {selectedTenantName}</p>
          </div>
          <div className="non-user-dashboard__cta">
            <button type="button" className="cta-button cta-button--primary" onClick={onExploreLocalization}>
              Lokalizasyonu incele
            </button>
            <button type="button" className="cta-button" onClick={onExploreLogs}>
              Operasyon loglarını gör
            </button>
          </div>
        </div>
        <div className="non-user-dashboard__auth-links">
          <p>Hesabınız hazır mı?</p>
          <div>
            <button type="button" onClick={onLogin}>
              Giriş Yap
            </button>
            <button type="button" onClick={onSignup}>
              Kayıt Ol
            </button>
          </div>
        </div>
      </header>

      <div className="non-user-dashboard__grid">
        <article className="non-user-dashboard__card">
          <h2>Platform içgörüleri</h2>
          <p>
            Rezervasyon akışları, oda doluluk oranları ve fiyat optimizasyonu gibi kritik metrikleri gerçek zamanlı olarak
            izleyin. Hazır rapor şablonlarıyla işletmenizin performansını anında analiz edin.
          </p>
          <ul>
            <li>Gerçek zamanlı gelir ve doluluk raporları</li>
            <li>Dinamik fiyatlandırma önerileri</li>
            <li>Operasyonel KPI panoları</li>
          </ul>
        </article>

        <article className="non-user-dashboard__card">
          <h2>Uygulama genel bilgilendirme</h2>
          <p>
            Agnostic Reservation; ön büro, satış ve pazarlama ekiplerinin aynı veriye erişmesini sağlayarak operasyonel
            verimliliği artırır. Mikro servis mimarisi ile ölçeklenebilir ve esnektir.
          </p>
          <ul>
            <li>Modüler ve genişletilebilir altyapı</li>
            <li>Global dil desteği</li>
            <li>Rol tabanlı yetkilendirme</li>
          </ul>
        </article>

        <article className="non-user-dashboard__card">
          <h2>Vizyon</h2>
          <p>
            Konuk ağırlama sektöründeki dijital dönüşümü hızlandırmak ve işletmelerin veri odaklı kararlar almasını
            kolaylaştırmak en büyük önceliğimiz.
          </p>
        </article>

        <article className="non-user-dashboard__card">
          <h2>Misyon</h2>
          <p>
            Konaklama yönetiminde teknolojiyi herkes için erişilebilir kılmak, entegrasyon bariyerlerini ortadan kaldırmak ve
            ekiplerin operasyonel süreçlerini sadeleştirmek için çalışıyoruz.
          </p>
        </article>
      </div>

      <section className="non-user-dashboard__info">
        <div>
          <h3>İletişim</h3>
          <p>Bizimle iletişime geçin: destek@agnosticreservation.com</p>
          <p>Telefon: +90 (212) 555 0100</p>
        </div>
        <div>
          <h3>Destek</h3>
          <p>7/24 canlı destek ve kapsamlı bilgi bankası ile tüm sorularınıza hızlıca yanıt veriyoruz.</p>
          <p>Öncelikli destek planları ve eğitim oturumları ile ekiplerinizi hızla adapte ediyoruz.</p>
        </div>
        <div>
          <h3>Güvenlik ve uyumluluk</h3>
          <p>GDPR uyumlu altyapı, şifrelenmiş veri aktarımı ve ayrıştırılmış tenant veri saklama prensibi.</p>
          <p>Detaylı log takibi ile aksiyonlarınız kayıt altında.</p>
        </div>
      </section>
    </section>
  );
};

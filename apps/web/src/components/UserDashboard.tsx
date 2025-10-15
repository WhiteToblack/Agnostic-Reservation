import React, { useMemo } from 'react';
import { Reservation } from '../types/domain';

type UserDashboardView = 'userReservations' | 'userProfile' | 'userSupport';

type UserDashboardProps = {
  userName: string;
  userEmail: string;
  tenantName: string;
  reservations: Reservation[];
  activeView: UserDashboardView;
};

const formatDateRange = (checkIn: string, checkOut: string) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long' });
  return `${dateFormatter.format(start)} - ${dateFormatter.format(end)}`;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' }).format(
    new Date(value)
  );

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);

export const UserDashboard: React.FC<UserDashboardProps> = ({
  userName,
  userEmail,
  tenantName,
  reservations,
  activeView,
}) => {
  const today = useMemo(() => new Date(), []);

  const { upcomingReservations, pastReservations } = useMemo(() => {
    const upcoming = reservations
      .filter((reservation) => new Date(reservation.checkOut) >= today)
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

    const history = reservations
      .filter((reservation) => new Date(reservation.checkOut) < today)
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());

    return { upcomingReservations: upcoming, pastReservations: history };
  }, [reservations, today]);

  const nextReservation = upcomingReservations[0];

  const totalNights = reservations.reduce((total, reservation) => total + reservation.nights, 0);
  const totalGuests = reservations.reduce((total, reservation) => total + reservation.guests, 0);
  const totalSpend = reservations.reduce((total, reservation) => total + reservation.totalPrice, 0);

  return (
    <section className="user-dashboard">
      <header className="user-dashboard__header">
        <div>
          <span className="user-dashboard__badge">{tenantName} misafir hesabı</span>
          <h1>Merhaba {userName.split(' ')[0]}, seyahatleriniz Agnostic Reservation ile güvende</h1>
          <p>
            Rezervasyon detaylarını yönetin, konaklama tercihlerinizin takibini yapın ve destek ekibimizle tek panelden iletişime
            geçin.
          </p>
        </div>
        <div className="user-dashboard__helper">
          <strong>Alan adı:</strong>
          <span>user.agnostic.com</span>
          <p>Bu ekran yalnızca son kullanıcı (misafir) deneyimi için sunulmaktadır.</p>
        </div>
      </header>

      {activeView === 'userReservations' && (
        <>
          {nextReservation ? (
            <article className="user-dashboard__card user-dashboard__card--highlight">
              <header>
                <h2>Bir sonraki konaklamanız hazır</h2>
                <span className="user-dashboard__status">{nextReservation.status}</span>
              </header>
              <div className="user-dashboard__card-body">
                <div>
                  <strong>{nextReservation.propertyName}</strong>
                  <p>{formatDateRange(nextReservation.checkIn, nextReservation.checkOut)}</p>
                  <p>
                    {nextReservation.guests} misafir · {nextReservation.nights} gece · {nextReservation.channel} kanalı
                  </p>
                  {nextReservation.notes && <p className="user-dashboard__note">Not: {nextReservation.notes}</p>}
                </div>
                <div className="user-dashboard__price">
                  <span>Toplam tutar</span>
                  <strong>{formatCurrency(nextReservation.totalPrice)}</strong>
                </div>
              </div>
              <footer>
                <button type="button">Giriş çıkış bilgilerini görüntüle</button>
                <button type="button" className="user-dashboard__ghost-button">
                  Rezervasyonu yönet
                </button>
              </footer>
            </article>
          ) : (
            <article className="user-dashboard__card user-dashboard__card--empty">
              <h2>Henüz yaklaşan bir rezervasyonunuz yok</h2>
              <p>Yeni bir seyahat planlamak için destek ekibimizle iletişime geçebilir veya sadakat programınızı inceleyebilirsiniz.</p>
              <button type="button">Yeni rezervasyon talebi oluştur</button>
            </article>
          )}

          <div className="user-dashboard__grid">
            <article className="user-dashboard__card">
              <header>
                <h2>Rezervasyon özetiniz</h2>
                <p>Hesabınız üzerinden yapılan tüm işlemler</p>
              </header>
              <dl className="user-dashboard__definition-list">
                <div>
                  <dt>Toplam gece</dt>
                  <dd>{totalNights}</dd>
                </div>
                <div>
                  <dt>Toplam misafir</dt>
                  <dd>{totalGuests}</dd>
                </div>
                <div>
                  <dt>Toplam harcama</dt>
                  <dd>{formatCurrency(totalSpend)}</dd>
                </div>
              </dl>
            </article>

            <article className="user-dashboard__card">
              <header>
                <h2>Yaklaşan seyahatler</h2>
                <p>Onaylanmış rezervasyonlarınız</p>
              </header>
              {upcomingReservations.length > 0 ? (
                <ul className="user-dashboard__list">
                  {upcomingReservations.map((reservation) => (
                    <li key={reservation.id}>
                      <div>
                        <strong>{reservation.propertyName}</strong>
                        <span>{reservation.channel}</span>
                      </div>
                      <div>
                        <span>{formatDate(reservation.checkIn)}</span>
                        <span className="user-dashboard__status">{reservation.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="user-dashboard__empty">Yaklaşan rezervasyon bulunmuyor.</p>
              )}
            </article>
          </div>

          <article className="user-dashboard__card">
            <header>
              <h2>Geçmiş konaklamalar</h2>
              <p>Son seyahatlerinizin özeti</p>
            </header>
            {pastReservations.length > 0 ? (
              <ul className="user-dashboard__list user-dashboard__list--history">
                {pastReservations.map((reservation) => (
                  <li key={reservation.id}>
                    <div>
                      <strong>{reservation.propertyName}</strong>
                      <span>{formatDateRange(reservation.checkIn, reservation.checkOut)}</span>
                    </div>
                    <div>
                      <span>{reservation.guests} misafir</span>
                      <span>{formatCurrency(reservation.totalPrice)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="user-dashboard__empty">Geçmiş kayıt bulunamadı.</p>
            )}
          </article>
        </>
      )}

      {activeView === 'userProfile' && (
        <div className="user-dashboard__grid user-dashboard__grid--balanced">
          <article className="user-dashboard__card">
            <header>
              <h2>Hesap bilgileri</h2>
              <p>Profil ve iletişim tercihleri</p>
            </header>
            <dl className="user-dashboard__definition-list">
              <div>
                <dt>Ad Soyad</dt>
                <dd>{userName}</dd>
              </div>
              <div>
                <dt>E-posta</dt>
                <dd>{userEmail}</dd>
              </div>
              <div>
                <dt>Bağlı tenant</dt>
                <dd>{tenantName}</dd>
              </div>
            </dl>
            <button type="button">Bilgilerimi güncelle</button>
          </article>

          <article className="user-dashboard__card">
            <header>
              <h2>Konaklama tercihleri</h2>
              <p>Sık kullanılan istekleriniz</p>
            </header>
            <ul className="user-dashboard__bullets">
              <li>Üst kat ve sessiz oda tercihi kaydedildi.</li>
              <li>Glutensiz kahvaltı menüsü isteği profilinize işlendi.</li>
              <li>Geç çıkış önceliği uygun müsaitlik olduğunda otomatik uygulanır.</li>
            </ul>
          </article>

          <article className="user-dashboard__card user-dashboard__card--highlight">
            <header>
              <h2>Sadakat durumu</h2>
              <p>Misafir kulübü avantajlarınız</p>
            </header>
            <ul className="user-dashboard__bullets">
              <li>Seviye: Platinum · Yıllık 24 gece</li>
              <li>Her konaklamada %15 indirim ve oda upgrade garantisi</li>
              <li>Öncelikli resepsiyon ve özel concierge hattı</li>
            </ul>
            <button type="button" className="user-dashboard__ghost-button">
              Tüm avantajları görüntüle
            </button>
          </article>
        </div>
      )}

      {activeView === 'userSupport' && (
        <div className="user-dashboard__grid">
          <article className="user-dashboard__card">
            <header>
              <h2>Destek talepleri</h2>
              <p>Son iletişim kayıtlarınız</p>
            </header>
            <ul className="user-dashboard__list">
              <li>
                <div>
                  <strong>Geç check-in isteği</strong>
                  <span>Referans: ST-541</span>
                </div>
                <div>
                  <span>10 Nisan 2024</span>
                  <span className="user-dashboard__status">Yanıtlandı</span>
                </div>
              </li>
              <li>
                <div>
                  <strong>Transfer rezervasyonu</strong>
                  <span>Referans: ST-538</span>
                </div>
                <div>
                  <span>05 Nisan 2024</span>
                  <span className="user-dashboard__status">Devam ediyor</span>
                </div>
              </li>
              <li>
                <div>
                  <strong>Oda yükseltme talebi</strong>
                  <span>Referans: ST-527</span>
                </div>
                <div>
                  <span>28 Mart 2024</span>
                  <span className="user-dashboard__status">Tamamlandı</span>
                </div>
              </li>
            </ul>
          </article>

          <article className="user-dashboard__card">
            <header>
              <h2>Canlı destek</h2>
              <p>7/24 yanınızdayız</p>
            </header>
            <ul className="user-dashboard__bullets">
              <li>WhatsApp hattı: +90 (555) 000 12 34</li>
              <li>E-posta: destek@agnosticreservation.com</li>
              <li>Öncelikli concierge: concierge@agnosticreservation.com</li>
            </ul>
            <button type="button">Canlı sohbeti başlat</button>
          </article>

          <article className="user-dashboard__card">
            <header>
              <h2>Faturalandırma</h2>
              <p>Resmi evrak ve ödemeleriniz</p>
            </header>
            <ul className="user-dashboard__bullets">
              <li>Son fatura: 15 Mart 2024 · ₺2.850 · Mail ile gönderildi.</li>
              <li>Kurumsal şirket ünvanı profilinize tanımlandı.</li>
              <li>Harcamalarınızı PDF ve e-arşiv formatında indirebilirsiniz.</li>
            </ul>
            <button type="button" className="user-dashboard__ghost-button">
              Belgeleri indir
            </button>
          </article>
        </div>
      )}
    </section>
  );
};

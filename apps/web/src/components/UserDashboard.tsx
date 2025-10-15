import React, { useEffect, useMemo, useState } from 'react';
import {
  BillingInformation,
  ContactInformation,
  Reservation,
  SupportInteraction,
} from '../types/domain';

type UserDashboardView = 'userReservations' | 'userProfile' | 'userSupport';

type UserDashboardProps = {
  userName: string;
  userEmail: string;
  tenantName: string;
  reservations: Reservation[];
  activeView: UserDashboardView;
  contact: ContactInformation;
  billing: BillingInformation;
  supportHistory: SupportInteraction[];
  tags?: string[];
  onProfileUpdate: (updates: { contact: ContactInformation; billing: BillingInformation }) => void;
  onCreateSupportRequest: (subject: string, summary: string) => void;
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
  contact,
  billing,
  supportHistory,
  tags = [],
  onProfileUpdate,
  onCreateSupportRequest,
}) => {
  const [contactDraft, setContactDraft] = useState<ContactInformation>(contact);
  const [billingDraft, setBillingDraft] = useState<BillingInformation>(billing);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportSummary, setSupportSummary] = useState('');
  const [supportMessage, setSupportMessage] = useState<string | null>(null);

  useEffect(() => {
    setContactDraft(contact);
  }, [contact]);

  useEffect(() => {
    setBillingDraft(billing);
  }, [billing]);

  useEffect(() => {
    setProfileMessage(null);
    setSupportMessage(null);
  }, [activeView]);

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
  const orderedSupportHistory = useMemo(
    () =>
      [...supportHistory].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [supportHistory]
  );
  const firstName = userName.split(' ')[0];

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onProfileUpdate({ contact: contactDraft, billing: billingDraft });
    setProfileMessage('Profil ayarlarınız kaydedildi.');
  };

  const handleSupportSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supportSubject.trim() || !supportSummary.trim()) {
      setSupportMessage('Lütfen konu ve açıklama alanlarını doldurun.');
      return;
    }

    onCreateSupportRequest(supportSubject.trim(), supportSummary.trim());
    setSupportSubject('');
    setSupportSummary('');
    setSupportMessage('Destek talebiniz alındı.');
  };

  return (
    <section className="user-dashboard">
      <header className="user-dashboard__header">
        <div>
          <span className="user-dashboard__badge">{tenantName} misafir hesabı</span>
          <h1>Merhaba {firstName}, seyahatleriniz Agnostic Reservation ile güvende</h1>
          <p>
            Rezervasyon detaylarını yönetin, konaklama tercihlerinizin takibini yapın ve destek ekibimizle tek panelden iletişime
            geçin.
          </p>
          {tags.length > 0 && (
            <div className="user-dashboard__tags" role="list">
              {tags.map((tag) => (
                <span key={tag} role="listitem">
                  {tag}
                </span>
              ))}
            </div>
          )}
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
          <article className="user-dashboard__card user-dashboard__card--form">
            <header>
              <h2>Profil ayarları</h2>
              <p>İletişim ve faturalandırma bilgilerinizi tek panelden güncelleyin.</p>
            </header>
            <dl className="user-dashboard__info-grid">
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
            {profileMessage && (
              <div className="user-dashboard__alert" role="status">
                {profileMessage}
                <button type="button" onClick={() => setProfileMessage(null)} aria-label="Bilgilendirmeyi kapat">
                  ×
                </button>
              </div>
            )}
            <form className="user-dashboard__settings" onSubmit={handleProfileSubmit}>
              <section>
                <h3>İletişim</h3>
                <label>
                  <span>Telefon</span>
                  <input
                    value={contactDraft.phoneNumber}
                    onChange={(event) =>
                      setContactDraft((draft) => ({ ...draft, phoneNumber: event.target.value }))
                    }
                    placeholder="+90 5XX XXX XX XX"
                  />
                </label>
                <label>
                  <span>Adres satırı 1</span>
                  <input
                    value={contactDraft.addressLine1}
                    onChange={(event) =>
                      setContactDraft((draft) => ({ ...draft, addressLine1: event.target.value }))
                    }
                    placeholder="Mahalle, cadde ve numara"
                  />
                </label>
                <label>
                  <span>Adres satırı 2</span>
                  <input
                    value={contactDraft.addressLine2 ?? ''}
                    onChange={(event) =>
                      setContactDraft((draft) => ({ ...draft, addressLine2: event.target.value }))
                    }
                    placeholder="Daire, ilçe vb."
                  />
                </label>
                <div className="user-dashboard__field-row">
                  <label>
                    <span>Şehir</span>
                    <input
                      value={contactDraft.city}
                      onChange={(event) =>
                        setContactDraft((draft) => ({ ...draft, city: event.target.value }))
                      }
                      placeholder="Şehir"
                    />
                  </label>
                  <label>
                    <span>Posta kodu</span>
                    <input
                      value={contactDraft.postalCode}
                      onChange={(event) =>
                        setContactDraft((draft) => ({ ...draft, postalCode: event.target.value }))
                      }
                      placeholder="00000"
                    />
                  </label>
                </div>
                <label>
                  <span>Ülke</span>
                  <input
                    value={contactDraft.country}
                    onChange={(event) =>
                      setContactDraft((draft) => ({ ...draft, country: event.target.value }))
                    }
                    placeholder="Türkiye"
                  />
                </label>
              </section>

              <section>
                <h3>Ödeme ve fatura</h3>
                <label>
                  <span>Kart sahibinin adı</span>
                  <input
                    value={billingDraft.cardHolderName}
                    onChange={(event) =>
                      setBillingDraft((draft) => ({ ...draft, cardHolderName: event.target.value }))
                    }
                    placeholder="Kart üzerindeki isim"
                  />
                </label>
                <div className="user-dashboard__field-row">
                  <label>
                    <span>Kart markası</span>
                    <input
                      value={billingDraft.cardBrand}
                      onChange={(event) =>
                        setBillingDraft((draft) => ({ ...draft, cardBrand: event.target.value }))
                      }
                      placeholder="Visa, MasterCard"
                    />
                  </label>
                  <label>
                    <span>Son dört hane</span>
                    <input
                      value={billingDraft.cardLast4}
                      onChange={(event) =>
                        setBillingDraft((draft) => ({ ...draft, cardLast4: event.target.value }))
                      }
                      placeholder="1234"
                    />
                  </label>
                </div>
                <div className="user-dashboard__field-row">
                  <label>
                    <span>Son kullanma (Ay)</span>
                    <input
                      value={billingDraft.expiryMonth}
                      onChange={(event) =>
                        setBillingDraft((draft) => ({ ...draft, expiryMonth: event.target.value }))
                      }
                      placeholder="08"
                    />
                  </label>
                  <label>
                    <span>Son kullanma (Yıl)</span>
                    <input
                      value={billingDraft.expiryYear}
                      onChange={(event) =>
                        setBillingDraft((draft) => ({ ...draft, expiryYear: event.target.value }))
                      }
                      placeholder="27"
                    />
                  </label>
                </div>
                <label>
                  <span>Fatura adresi</span>
                  <input
                    value={billingDraft.billingAddress}
                    onChange={(event) =>
                      setBillingDraft((draft) => ({ ...draft, billingAddress: event.target.value }))
                    }
                    placeholder="Adres satırı"
                  />
                </label>
                <div className="user-dashboard__field-row">
                  <label>
                    <span>Fatura şehri</span>
                    <input
                      value={billingDraft.billingCity}
                      onChange={(event) =>
                        setBillingDraft((draft) => ({ ...draft, billingCity: event.target.value }))
                      }
                      placeholder="İstanbul"
                    />
                  </label>
                  <label>
                    <span>Fatura posta kodu</span>
                    <input
                      value={billingDraft.billingPostalCode}
                      onChange={(event) =>
                        setBillingDraft((draft) => ({ ...draft, billingPostalCode: event.target.value }))
                      }
                      placeholder="34728"
                    />
                  </label>
                </div>
                <label>
                  <span>Fatura ülkesi</span>
                  <input
                    value={billingDraft.billingCountry}
                    onChange={(event) =>
                      setBillingDraft((draft) => ({ ...draft, billingCountry: event.target.value }))
                    }
                    placeholder="Türkiye"
                  />
                </label>
              </section>

              <div className="user-dashboard__form-actions">
                <button type="submit">Profil ayarlarımı kaydet</button>
              </div>
            </form>
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
        <div className="user-dashboard__grid user-dashboard__grid--support">
          <article className="user-dashboard__card user-dashboard__card--form">
            <header>
              <h2>Destek talebi oluştur</h2>
              <p>Ekibimize ulaşın; talebiniz tenant destek kuyruğuna iletilir.</p>
            </header>
            {supportMessage && (
              <div className="user-dashboard__alert" role="status">
                {supportMessage}
                <button type="button" onClick={() => setSupportMessage(null)} aria-label="Bilgilendirmeyi kapat">
                  ×
                </button>
              </div>
            )}
            <form className="user-dashboard__settings user-dashboard__settings--single" onSubmit={handleSupportSubmit}>
              <label>
                <span>Konu</span>
                <input
                  value={supportSubject}
                  onChange={(event) => setSupportSubject(event.target.value)}
                  placeholder="Örneğin: Erken giriş talebi"
                />
              </label>
              <label>
                <span>Talep detayı</span>
                <textarea
                  rows={4}
                  value={supportSummary}
                  onChange={(event) => setSupportSummary(event.target.value)}
                  placeholder="Destek ekibine iletmek istediğiniz açıklamayı yazın"
                />
              </label>
              <div className="user-dashboard__form-actions">
                <button type="submit">Talebi gönder</button>
              </div>
            </form>
          </article>

          <article className="user-dashboard__card">
            <header>
              <h2>Destek geçmişiniz</h2>
              <p>Önceki taleplerinizin durumu</p>
            </header>
            <ul className="user-dashboard__timeline">
              {orderedSupportHistory.length === 0 && (
                <li className="user-dashboard__empty">Henüz destek kaydı bulunmuyor.</li>
              )}
              {orderedSupportHistory.map((interaction) => (
                <li key={interaction.id} className={`user-dashboard__timeline-item status-${interaction.status}`}>
                  <div>
                    <strong>{interaction.subject}</strong>
                    <span className="user-dashboard__timeline-meta">
                      {interaction.channel} · {formatDate(interaction.createdAt)}
                    </span>
                  </div>
                  <p>{interaction.summary}</p>
                  <span className="user-dashboard__timeline-status">{interaction.status}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="user-dashboard__card user-dashboard__card--highlight">
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
        </div>
      )}
    </section>
  );
};

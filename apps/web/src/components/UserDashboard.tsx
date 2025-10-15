import React, { useEffect, useMemo, useState } from 'react';
import {
  BillingInformation,
  ContactInformation,
  SupportInteraction,
} from '../types/domain';

export type ReservationStatusCode = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export type ReservationTimelinePoint = {
  date: string;
  count: number;
};

type ReservationRow = {
  id: string;
  resourceId: string;
  resourceName: string;
  startUtc: string;
  endUtc: string;
  status: ReservationStatusCode;
};

type ResourceOption = {
  id: string;
  name: string;
};

type UserDashboardView = 'userReservations' | 'userProfile' | 'userSupport';

type UserDashboardProps = {
  userName: string;
  userEmail: string;
  tenantName: string;
  reservations: ReservationRow[];
  timeline: ReservationTimelinePoint[];
  resources: ResourceOption[];
  activeView: UserDashboardView;
  contact: ContactInformation;
  billing: BillingInformation;
  supportHistory: SupportInteraction[];
  tags?: string[];
  loading?: boolean;
  onProfileUpdate: (updates: { contact: ContactInformation; billing: BillingInformation }) => void;
  onCreateSupportRequest: (subject: string, summary: string) => void;
  onReservationCreate: (payload: { resourceId: string; startUtc: string; endUtc: string }) => void;
  onReservationUpdate: (
    reservationId: string,
    updates: { startUtc?: string; endUtc?: string; status?: ReservationStatusCode }
  ) => void;
  onReservationDelete: (reservationId: string) => void;
};

const statusLabels: Record<ReservationStatusCode, string> = {
  Pending: 'Beklemede',
  Confirmed: 'Onaylandı',
  Cancelled: 'İptal',
  Completed: 'Tamamlandı',
};

const statusOptions: ReservationStatusCode[] = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

const formatDateTimeRange = (startIso: string, endIso: string) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const datePart = sameDay
    ? dateFormatter.format(start)
    : `${dateFormatter.format(start)} - ${dateFormatter.format(end)}`;
  return `${datePart} · ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
};

const toDateInputValue = (isoValue: string) => new Date(isoValue).toISOString().split('T')[0];
const toTimeInputValue = (isoValue: string) => new Date(isoValue).toISOString().split('T')[1]?.slice(0, 5) ?? '09:00';

const computeDurationMinutes = (startIso: string, endIso: string) => {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(30, Math.round(diff / (1000 * 60)));
};

export const UserDashboard: React.FC<UserDashboardProps> = ({
  userName,
  userEmail,
  tenantName,
  reservations,
  timeline,
  resources,
  activeView,
  contact,
  billing,
  supportHistory,
  tags = [],
  loading = false,
  onProfileUpdate,
  onCreateSupportRequest,
  onReservationCreate,
  onReservationUpdate,
  onReservationDelete,
}) => {
  const [contactDraft, setContactDraft] = useState<ContactInformation>(contact);
  const [billingDraft, setBillingDraft] = useState<BillingInformation>(billing);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportSummary, setSupportSummary] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const [reservationMessage, setReservationMessage] = useState<
    { tone: 'success' | 'warning'; text: string } | null
  >(null);
  const [newReservationForm, setNewReservationForm] = useState({
    resourceId: resources[0]?.id ?? '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    durationMinutes: 60,
  });
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    startTime: '09:00',
    durationMinutes: 60,
    status: 'Confirmed' as ReservationStatusCode,
  });

  useEffect(() => {
    setContactDraft(contact);
  }, [contact]);

  useEffect(() => {
    setBillingDraft(billing);
  }, [billing]);

  useEffect(() => {
    setNewReservationForm((form) => {
      if (form.resourceId && resources.some((resource) => resource.id === form.resourceId)) {
        return form;
      }

      return {
        ...form,
        resourceId: resources[0]?.id ?? '',
      };
    });
  }, [resources]);

  useEffect(() => {
    setProfileMessage(null);
    setSupportMessage(null);
    setReservationMessage(null);
    setEditingReservationId(null);
  }, [activeView, reservations]);

  const sortedReservations = useMemo(
    () =>
      [...reservations].sort(
        (a, b) => new Date(b.startUtc).getTime() - new Date(a.startUtc).getTime()
      ),
    [reservations]
  );

  const nextReservation = useMemo(
    () =>
      sortedReservations
        .filter((reservation) => new Date(reservation.endUtc) > new Date())
        .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())[0],
    [sortedReservations]
  );

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onProfileUpdate({ contact: contactDraft, billing: billingDraft });
    setProfileMessage('Profil bilgileri güncellendi.');
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

  const handleCreateReservation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newReservationForm.resourceId) {
      setReservationMessage({ tone: 'warning', text: 'Lütfen bir kaynak seçin.' });
      return;
    }

    const startUtc = new Date(
      `${newReservationForm.date}T${newReservationForm.startTime}:00`
    ).toISOString();
    const endUtc = new Date(
      new Date(`${newReservationForm.date}T${newReservationForm.startTime}:00`).getTime() +
        newReservationForm.durationMinutes * 60 * 1000
    ).toISOString();

    onReservationCreate({
      resourceId: newReservationForm.resourceId,
      startUtc,
      endUtc,
    });
    setNewReservationForm((form) => ({ ...form, durationMinutes: 60 }));
    setReservationMessage({ tone: 'success', text: 'Rezervasyon isteğiniz alındı.' });
  };

  const beginEditReservation = (reservation: ReservationRow) => {
    setEditingReservationId(reservation.id);
    setEditForm({
      date: toDateInputValue(reservation.startUtc),
      startTime: toTimeInputValue(reservation.startUtc),
      durationMinutes: computeDurationMinutes(reservation.startUtc, reservation.endUtc),
      status: reservation.status,
    });
  };

  const handleEditReservationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingReservationId) {
      return;
    }
    const startUtc = new Date(`${editForm.date}T${editForm.startTime}:00`).toISOString();
    const endUtc = new Date(
      new Date(`${editForm.date}T${editForm.startTime}:00`).getTime() + editForm.durationMinutes * 60 * 1000
    ).toISOString();
    onReservationUpdate(editingReservationId, {
      startUtc,
      endUtc,
      status: editForm.status,
    });
    setEditingReservationId(null);
  };

  const timelineMax = useMemo(
    () => Math.max(...timeline.map((point) => point.count), 1),
    [timeline]
  );

  const renderTimeline = () => {
    if (timeline.length === 0) {
      return <p className="user-dashboard__empty">Yaklaşan rezervasyon bulunmuyor.</p>;
    }

    return (
      <ul className="user-dashboard__timeline" role="list">
        {timeline.map((point) => {
          const width = `${Math.max(10, (point.count / timelineMax) * 100)}%`;
          return (
            <li key={point.date} className="user-dashboard__timeline-item">
              <span className="user-dashboard__timeline-date">
                {new Date(`${point.date}T00:00:00Z`).toLocaleDateString('tr-TR', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
              <div className="user-dashboard__timeline-bar" aria-hidden>
                <span style={{ width }} />
              </div>
              <span className="user-dashboard__timeline-count">{point.count} randevu</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <section className="user-dashboard">
      <header className="user-dashboard__header">
        <div>
          <span className="user-dashboard__badge">{tenantName} misafir hesabı</span>
          <h1>Merhaba {userName.split(' ')[0]}, rezervasyonlarını tek panelden yönet</h1>
          <p>
            Ajandandaki tüm rezervasyonları görüntüle, yeni talep oluştur ve iletişim bilgilerini güncel tut.
            Agnostic Reservation, deneyimini uçtan uca destekler.
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
          <strong>E-posta</strong>
          <span>{userEmail}</span>
          <strong>Aktif tenant</strong>
          <span>{tenantName}</span>
        </div>
      </header>

      {activeView === 'userReservations' && (
        <div className="user-dashboard__content">
          <article className="user-dashboard__card user-dashboard__card--highlight">
            <header>
              <h2>Rezervasyon zaman çizelgesi</h2>
              <p>Önümüzdeki günlerde planlanmış randevuların yoğunluğunu inceleyin.</p>
            </header>
            {renderTimeline()}
            {nextReservation && (
              <footer>
                <strong>Sonraki rezervasyon</strong>
                <span>{formatDateTimeRange(nextReservation.startUtc, nextReservation.endUtc)}</span>
                <span>{nextReservation.resourceName} · {statusLabels[nextReservation.status]}</span>
              </footer>
            )}
          </article>

          <div className="user-dashboard__grid-layout">
            <article className="user-dashboard__card">
              <header>
                <h2>Yeni rezervasyon ekle</h2>
                <p>Uygun bir kaynağı seçin ve istediğiniz saat aralığını kaydedin.</p>
              </header>
              <form className="user-dashboard__form" onSubmit={handleCreateReservation}>
                <label>
                  <span>Kaynak</span>
                  <select
                    value={newReservationForm.resourceId}
                    onChange={(event) =>
                      setNewReservationForm((form) => ({ ...form, resourceId: event.target.value }))
                    }
                    disabled={loading}
                  >
                    <option value="">Kaynak seçin</option>
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="user-dashboard__form-row">
                  <label>
                    <span>Tarih</span>
                    <input
                      type="date"
                      value={newReservationForm.date}
                      onChange={(event) =>
                        setNewReservationForm((form) => ({ ...form, date: event.target.value }))
                      }
                      disabled={loading}
                    />
                  </label>
                  <label>
                    <span>Başlangıç</span>
                    <input
                      type="time"
                      value={newReservationForm.startTime}
                      onChange={(event) =>
                        setNewReservationForm((form) => ({ ...form, startTime: event.target.value }))
                      }
                      disabled={loading}
                    />
                  </label>
                  <label>
                    <span>Süre (dakika)</span>
                    <input
                      type="number"
                      min={30}
                      step={15}
                      value={newReservationForm.durationMinutes}
                      onChange={(event) =>
                        setNewReservationForm((form) => ({
                          ...form,
                          durationMinutes: Number(event.target.value) || 60,
                        }))
                      }
                      disabled={loading}
                    />
                  </label>
                </div>
                <div className="user-dashboard__form-actions">
                  <button type="submit" disabled={loading}>
                    Ekle
                  </button>
                </div>
                {reservationMessage && (
                  <p
                    className={`user-dashboard__feedback${
                      reservationMessage.tone === 'warning' ? ' user-dashboard__feedback--warning' : ''
                    }`}
                  >
                    {reservationMessage.text}
                  </p>
                )}
              </form>
            </article>

            <article className="user-dashboard__card user-dashboard__card--table">
              <header>
                <h2>Rezervasyon listesi</h2>
                <p>En yeni işlemler üstte olacak şekilde sıralanmıştır.</p>
              </header>
              <div className="user-dashboard__table-wrapper" role="region" aria-live="polite">
                {sortedReservations.length === 0 ? (
                  <p className="user-dashboard__empty">Henüz kayıtlı bir rezervasyon yok.</p>
                ) : (
                  <table className="user-dashboard__table">
                    <thead>
                      <tr>
                        <th scope="col">Kaynak</th>
                        <th scope="col">Zaman</th>
                        <th scope="col">Durum</th>
                        <th scope="col" className="user-dashboard__table-actions">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReservations.map((reservation) => {
                        const isEditing = editingReservationId === reservation.id;
                        return (
                          <tr key={reservation.id}>
                            <td data-label="Kaynak">{reservation.resourceName}</td>
                            <td data-label="Zaman">{formatDateTimeRange(reservation.startUtc, reservation.endUtc)}</td>
                            <td data-label="Durum">{statusLabels[reservation.status]}</td>
                            <td className="user-dashboard__table-actions">
                              {isEditing ? (
                                <form onSubmit={handleEditReservationSubmit} className="user-dashboard__inline-form">
                                  <input
                                    type="date"
                                    value={editForm.date}
                                    onChange={(event) =>
                                      setEditForm((form) => ({ ...form, date: event.target.value }))
                                    }
                                    disabled={loading}
                                  />
                                  <input
                                    type="time"
                                    value={editForm.startTime}
                                    onChange={(event) =>
                                      setEditForm((form) => ({ ...form, startTime: event.target.value }))
                                    }
                                    disabled={loading}
                                  />
                                  <input
                                    type="number"
                                    min={30}
                                    step={15}
                                    value={editForm.durationMinutes}
                                    onChange={(event) =>
                                      setEditForm((form) => ({
                                        ...form,
                                        durationMinutes: Number(event.target.value) || 60,
                                      }))
                                    }
                                    disabled={loading}
                                  />
                                  <select
                                    value={editForm.status}
                                    onChange={(event) =>
                                      setEditForm((form) => ({
                                        ...form,
                                        status: event.target.value as ReservationStatusCode,
                                      }))
                                    }
                                    disabled={loading}
                                  >
                                    {statusOptions.map((option) => (
                                      <option key={option} value={option}>
                                        {statusLabels[option]}
                                      </option>
                                    ))}
                                  </select>
                                  <button type="submit" disabled={loading}>
                                    Kaydet
                                  </button>
                                  <button
                                    type="button"
                                    className="user-dashboard__ghost-button"
                                    onClick={() => setEditingReservationId(null)}
                                  >
                                    İptal
                                  </button>
                                </form>
                              ) : (
                                <div className="user-dashboard__action-group">
                                  <button type="button" onClick={() => beginEditReservation(reservation)} disabled={loading}>
                                    Güncelle
                                  </button>
                                  <button
                                    type="button"
                                    className="user-dashboard__ghost-button"
                                    onClick={() => onReservationDelete(reservation.id)}
                                    disabled={loading}
                                  >
                                    Sil
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </article>
          </div>
        </div>
      )}

      {activeView === 'userProfile' && (
        <div className="user-dashboard__content">
          <article className="user-dashboard__card">
            <header>
              <h2>İletişim bilgileri</h2>
              <p>Rezervasyon onayları ve bildirimler için kullanılacak iletişim adresleri.</p>
            </header>
            <form className="user-dashboard__form" onSubmit={handleProfileSubmit}>
              <label>
                <span>Telefon</span>
                <input
                  value={contactDraft.phoneNumber}
                  onChange={(event) => setContactDraft((draft) => ({ ...draft, phoneNumber: event.target.value }))}
                />
              </label>
              <label>
                <span>Adres satırı 1</span>
                <input
                  value={contactDraft.addressLine1}
                  onChange={(event) => setContactDraft((draft) => ({ ...draft, addressLine1: event.target.value }))}
                />
              </label>
              <label>
                <span>Adres satırı 2</span>
                <input
                  value={contactDraft.addressLine2 ?? ''}
                  onChange={(event) => setContactDraft((draft) => ({ ...draft, addressLine2: event.target.value }))}
                />
              </label>
              <div className="user-dashboard__form-row">
                <label>
                  <span>Şehir</span>
                  <input
                    value={contactDraft.city}
                    onChange={(event) => setContactDraft((draft) => ({ ...draft, city: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Ülke</span>
                  <input
                    value={contactDraft.country}
                    onChange={(event) => setContactDraft((draft) => ({ ...draft, country: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Posta kodu</span>
                  <input
                    value={contactDraft.postalCode}
                    onChange={(event) => setContactDraft((draft) => ({ ...draft, postalCode: event.target.value }))}
                  />
                </label>
              </div>

              <header>
                <h3>Faturalandırma</h3>
              </header>
              <label>
                <span>Fatura unvanı</span>
                <input
                  value={billingDraft.billingName}
                  onChange={(event) => setBillingDraft((draft) => ({ ...draft, billingName: event.target.value }))}
                />
              </label>
              <label>
                <span>Vergi numarası</span>
                <input
                  value={billingDraft.billingTaxNumber}
                  onChange={(event) => setBillingDraft((draft) => ({ ...draft, billingTaxNumber: event.target.value }))}
                />
              </label>
              <label>
                <span>Fatura adresi</span>
                <input
                  value={billingDraft.billingAddress}
                  onChange={(event) => setBillingDraft((draft) => ({ ...draft, billingAddress: event.target.value }))}
                />
              </label>
              <div className="user-dashboard__form-row">
                <label>
                  <span>Şehir</span>
                  <input
                    value={billingDraft.billingCity}
                    onChange={(event) => setBillingDraft((draft) => ({ ...draft, billingCity: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Ülke</span>
                  <input
                    value={billingDraft.billingCountry}
                    onChange={(event) => setBillingDraft((draft) => ({ ...draft, billingCountry: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Posta kodu</span>
                  <input
                    value={billingDraft.billingPostalCode}
                    onChange={(event) => setBillingDraft((draft) => ({ ...draft, billingPostalCode: event.target.value }))}
                  />
                </label>
              </div>

              <div className="user-dashboard__form-actions">
                <button type="submit">Profili kaydet</button>
              </div>
              {profileMessage && <p className="user-dashboard__feedback">{profileMessage}</p>}
            </form>
          </article>
        </div>
      )}

      {activeView === 'userSupport' && (
        <div className="user-dashboard__content">
          <article className="user-dashboard__card">
            <header>
              <h2>Destek geçmişi</h2>
              <p>Son iletişimlerinizin özetini ve durumlarını inceleyin.</p>
            </header>
            <ul className="user-dashboard__timeline">
              {supportHistory.length === 0 && (
                <li className="user-dashboard__empty">Henüz destek kaydı oluşturmadınız.</li>
              )}
              {supportHistory.map((interaction) => (
                <li key={interaction.id} className={`user-dashboard__timeline-item status-${interaction.status}`}>
                  <div>
                    <strong>{interaction.subject}</strong>
                    <span className="user-dashboard__timeline-meta">
                      {interaction.channel} · {new Date(interaction.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <p>{interaction.summary}</p>
                  <span className="user-dashboard__timeline-count">{interaction.status}</span>
                </li>
              ))}
            </ul>
            <form className="user-dashboard__form" onSubmit={handleSupportSubmit}>
              <label>
                <span>Konu</span>
                <input value={supportSubject} onChange={(event) => setSupportSubject(event.target.value)} />
              </label>
              <label>
                <span>Açıklama</span>
                <textarea value={supportSummary} onChange={(event) => setSupportSummary(event.target.value)} />
              </label>
              <div className="user-dashboard__form-actions">
                <button type="submit">Destek talebi gönder</button>
              </div>
              {supportMessage && <p className="user-dashboard__feedback">{supportMessage}</p>}
            </form>
          </article>
        </div>
      )}
    </section>
  );
};

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { BillingInformation, RegisteredUser, SupportInteraction } from '../types/domain';

type SupportDirectoryEntry = {
  key: string;
  user: RegisteredUser;
};

type AdminSupportPanelProps = {
  tenantName: string;
  users: SupportDirectoryEntry[];
  onUpdateUser: (userKey: string, updates: Partial<RegisteredUser>) => void;
  onCreateInteraction: (
    userKey: string,
    subject: string,
    summary: string,
    status: SupportInteraction['status'],
    channel: SupportInteraction['channel']
  ) => void;
};

const emptyContact = {
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  country: '',
  postalCode: '',
};

const emptyBilling: BillingInformation = {
  cardHolderName: '',
  cardBrand: 'VISA',
  cardLast4: '',
  expiryMonth: '',
  expiryYear: '',
  billingAddress: '',
  billingCity: '',
  billingCountry: '',
  billingPostalCode: '',
};

const supportStatuses: SupportInteraction['status'][] = ['Alındı', 'Yanıtlandı', 'Çözüldü'];
const supportChannels: SupportInteraction['channel'][] = ['Portal', 'E-posta', 'Telefon', 'Canlı Sohbet'];

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const AdminSupportPanel: React.FC<AdminSupportPanelProps> = ({
  tenantName,
  users,
  onUpdateUser,
  onCreateInteraction,
}) => {
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>(users[0]?.key ?? '');
  const [contactForm, setContactForm] = useState(users[0]?.user.contact ?? emptyContact);
  const [billingForm, setBillingForm] = useState<BillingInformation>(users[0]?.user.billing ?? emptyBilling);
  const [noteSubject, setNoteSubject] = useState('');
  const [noteSummary, setNoteSummary] = useState('');
  const [noteStatus, setNoteStatus] = useState<SupportInteraction['status']>('Alındı');
  const [noteChannel, setNoteChannel] = useState<SupportInteraction['channel']>('Portal');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter(({ user }) => {
      const tags = user.tags?.join(' ') ?? '';
      return [user.fullName, user.email, user.contact.phoneNumber, tags]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [search, users]);

  useEffect(() => {
    if (users.length === 0) {
      setSelectedKey('');
      return;
    }

    if (!users.some((entry) => entry.key === selectedKey)) {
      setSelectedKey(users[0].key);
    }
  }, [users, selectedKey]);

  useEffect(() => {
    if (filteredUsers.length === 0) {
      setSelectedKey('');
      return;
    }

    if (!filteredUsers.some((entry) => entry.key === selectedKey)) {
      setSelectedKey(filteredUsers[0].key);
    }
  }, [filteredUsers, selectedKey]);

  const activeEntry = useMemo(
    () => filteredUsers.find((entry) => entry.key === selectedKey) ?? filteredUsers[0] ?? null,
    [filteredUsers, selectedKey]
  );

  useEffect(() => {
    if (activeEntry) {
      setContactForm(activeEntry.user.contact ?? emptyContact);
      setBillingForm(activeEntry.user.billing ?? emptyBilling);
      setFeedback(null);
    }
  }, [activeEntry]);

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeEntry) {
      return;
    }

    onUpdateUser(activeEntry.key, { contact: { ...contactForm } });
    setFeedback('İletişim bilgileri güncellendi.');
  };

  const handleBillingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeEntry) {
      return;
    }

    onUpdateUser(activeEntry.key, { billing: { ...billingForm } });
    setFeedback('Ödeme profili güncellendi.');
  };

  const handleAddNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeEntry) {
      return;
    }

    if (!noteSubject.trim() || !noteSummary.trim()) {
      setFeedback('Lütfen destek kaydı için konu ve özet alanlarını doldurun.');
      return;
    }

    onCreateInteraction(
      activeEntry.key,
      noteSubject.trim(),
      noteSummary.trim(),
      noteStatus,
      noteChannel
    );
    setNoteSubject('');
    setNoteSummary('');
    setFeedback('Yeni destek kaydı oluşturuldu.');
  };

  return (
    <section className="support-admin admin-card">
      <header className="support-admin__header">
        <div>
          <h1>Destek merkezi — {tenantName}</h1>
          <p>
            Misafir profillerini inceleyin, iletişim bilgilerini güncelleyin ve destek etkileşimlerini takip edin. Tüm değişiklikler
            anında tenant bazlı olarak kaydedilir.
          </p>
        </div>
        <div className="support-admin__actions">
          <input
            type="search"
            className="support-admin__search"
            placeholder="İsim, e-posta veya etiket ile ara"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="support-admin__counter">{filteredUsers.length} kayıt</span>
        </div>
      </header>

      {feedback && (
        <div className="support-admin__feedback" role="status">
          {feedback}
          <button type="button" onClick={() => setFeedback(null)} aria-label="Uyarıyı kapat">
            ×
          </button>
        </div>
      )}

      <div className="support-admin__layout">
        <aside className="support-admin__aside">
          <ul className="support-admin__list">
            {filteredUsers.length === 0 && <li className="support-admin__empty">Eşleşen destek profili bulunamadı.</li>}
            {filteredUsers.map((entry) => {
              const isActive = activeEntry?.key === entry.key;
              return (
                <li key={entry.key} className={isActive ? 'support-admin__item support-admin__item--active' : 'support-admin__item'}>
                  <button type="button" onClick={() => setSelectedKey(entry.key)}>
                    <span className="support-admin__item-name">{entry.user.fullName}</span>
                    <span className="support-admin__item-email">{entry.user.email}</span>
                    <span className="support-admin__item-phone">{entry.user.contact.phoneNumber || 'Telefon tanımlı değil'}</span>
                    {entry.user.tags && entry.user.tags.length > 0 && (
                      <span className="support-admin__item-tags">{entry.user.tags.join(' · ')}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="support-admin__content">
          {activeEntry ? (
            <>
              <section className="support-admin__card">
                <header>
                  <h2>İletişim bilgileri</h2>
                  <p>Destek görüşmeleri sırasında kullanılacak temel bilgiler.</p>
                </header>
                <form className="support-admin__form" onSubmit={handleContactSubmit}>
                  <label>
                    <span>Telefon</span>
                    <input
                      value={contactForm.phoneNumber}
                      onChange={(event) => setContactForm((form) => ({ ...form, phoneNumber: event.target.value }))}
                      placeholder="+90 5XX XXX XX XX"
                    />
                  </label>
                  <label>
                    <span>Adres</span>
                    <input
                      value={contactForm.addressLine1}
                      onChange={(event) => setContactForm((form) => ({ ...form, addressLine1: event.target.value }))}
                      placeholder="Mahalle, cadde, numara"
                    />
                  </label>
                  <label>
                    <span>Adres (devam)</span>
                    <input
                      value={contactForm.addressLine2 ?? ''}
                      onChange={(event) => setContactForm((form) => ({ ...form, addressLine2: event.target.value }))}
                      placeholder="Daire, ilçe vb."
                    />
                  </label>
                  <label>
                    <span>Şehir</span>
                    <input
                      value={contactForm.city}
                      onChange={(event) => setContactForm((form) => ({ ...form, city: event.target.value }))}
                      placeholder="Şehir"
                    />
                  </label>
                  <label>
                    <span>Ülke</span>
                    <input
                      value={contactForm.country}
                      onChange={(event) => setContactForm((form) => ({ ...form, country: event.target.value }))}
                      placeholder="Ülke"
                    />
                  </label>
                  <label>
                    <span>Posta kodu</span>
                    <input
                      value={contactForm.postalCode}
                      onChange={(event) => setContactForm((form) => ({ ...form, postalCode: event.target.value }))}
                      placeholder="Posta kodu"
                    />
                  </label>
                  <div className="support-admin__form-actions">
                    <button type="submit">İletişim bilgilerini kaydet</button>
                  </div>
                </form>
              </section>

              <section className="support-admin__card">
                <header>
                  <h2>Ödeme ve faturalandırma</h2>
                  <p>Kurumsal faturalar ve ön provizyon işlemleri için kart bilgileri.</p>
                </header>
                <form className="support-admin__form" onSubmit={handleBillingSubmit}>
                  <label>
                    <span>Kart sahibinin adı</span>
                    <input
                      value={billingForm.cardHolderName}
                      onChange={(event) => setBillingForm((form) => ({ ...form, cardHolderName: event.target.value }))}
                      placeholder="Kart üzerindeki isim"
                    />
                  </label>
                  <label>
                    <span>Kart markası</span>
                    <input
                      value={billingForm.cardBrand}
                      onChange={(event) => setBillingForm((form) => ({ ...form, cardBrand: event.target.value }))}
                      placeholder="Visa, MasterCard vb."
                    />
                  </label>
                  <label>
                    <span>Kart son dört hane</span>
                    <input
                      value={billingForm.cardLast4}
                      onChange={(event) => setBillingForm((form) => ({ ...form, cardLast4: event.target.value }))}
                      placeholder="1234"
                    />
                  </label>
                  <label>
                    <span>Son kullanma (AA/YY)</span>
                    <div className="support-admin__expiry">
                      <input
                        value={billingForm.expiryMonth}
                        onChange={(event) => setBillingForm((form) => ({ ...form, expiryMonth: event.target.value }))}
                        placeholder="Ay"
                      />
                      <input
                        value={billingForm.expiryYear}
                        onChange={(event) => setBillingForm((form) => ({ ...form, expiryYear: event.target.value }))}
                        placeholder="Yıl"
                      />
                    </div>
                  </label>
                  <label>
                    <span>Fatura adresi</span>
                    <input
                      value={billingForm.billingAddress}
                      onChange={(event) => setBillingForm((form) => ({ ...form, billingAddress: event.target.value }))}
                      placeholder="Adres satırı"
                    />
                  </label>
                  <label>
                    <span>Fatura şehri</span>
                    <input
                      value={billingForm.billingCity}
                      onChange={(event) => setBillingForm((form) => ({ ...form, billingCity: event.target.value }))}
                      placeholder="Şehir"
                    />
                  </label>
                  <label>
                    <span>Fatura ülkesi</span>
                    <input
                      value={billingForm.billingCountry}
                      onChange={(event) => setBillingForm((form) => ({ ...form, billingCountry: event.target.value }))}
                      placeholder="Ülke"
                    />
                  </label>
                  <label>
                    <span>Fatura posta kodu</span>
                    <input
                      value={billingForm.billingPostalCode}
                      onChange={(event) => setBillingForm((form) => ({ ...form, billingPostalCode: event.target.value }))}
                      placeholder="Posta kodu"
                    />
                  </label>
                  <div className="support-admin__form-actions">
                    <button type="submit">Faturalandırmayı kaydet</button>
                  </div>
                </form>
              </section>

              <section className="support-admin__card">
                <header>
                  <h2>Destek geçmişi</h2>
                  <p>Son destek talepleri ve durumları.</p>
                </header>
                <ul className="support-admin__timeline">
                  {activeEntry.user.supportHistory.length === 0 && (
                    <li className="support-admin__empty">Destek kaydı bulunmuyor.</li>
                  )}
                  {activeEntry.user.supportHistory.map((interaction) => (
                    <li key={interaction.id} className={`support-admin__timeline-item status-${interaction.status}`}>
                      <div>
                        <strong>{interaction.subject}</strong>
                        <span className="support-admin__timeline-meta">
                          {interaction.channel} · {formatDate(interaction.createdAt)}
                        </span>
                      </div>
                      <p>{interaction.summary}</p>
                      <span className="support-admin__timeline-status">{interaction.status}</span>
                    </li>
                  ))}
                </ul>

                <form className="support-admin__note" onSubmit={handleAddNote}>
                  <div className="support-admin__note-grid">
                    <label>
                      <span>Konu</span>
                      <input value={noteSubject} onChange={(event) => setNoteSubject(event.target.value)} />
                    </label>
                    <label>
                      <span>Durum</span>
                      <select value={noteStatus} onChange={(event) => setNoteStatus(event.target.value as SupportInteraction['status'])}>
                        {supportStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Kanal</span>
                      <select value={noteChannel} onChange={(event) => setNoteChannel(event.target.value as SupportInteraction['channel'])}>
                        {supportChannels.map((channel) => (
                          <option key={channel} value={channel}>
                            {channel}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    <span>Özet</span>
                    <textarea
                      rows={3}
                      value={noteSummary}
                      onChange={(event) => setNoteSummary(event.target.value)}
                      placeholder="Misafir ile yapılan görüşme notları"
                    />
                  </label>
                  <div className="support-admin__form-actions">
                    <button type="submit">Destek kaydı ekle</button>
                  </div>
                </form>
              </section>
            </>
          ) : (
            <div className="support-admin__empty">Destek profili seçmek için sol taraftan bir misafir seçin.</div>
          )}
        </div>
      </div>
    </section>
  );
};

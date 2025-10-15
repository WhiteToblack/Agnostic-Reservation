# Test Senaryoları ve Veri Girişi

Bu doküman, Agnostic Reservation platformunun ana akışlarının uçtan uca doğrulanması için kullanılabilecek fonksiyonel test senaryolarını içerir. Senaryolar yerleşik varsayılan veri kümeleri üzerinden tanımlanmıştır ve yerel geliştirme ortamında (`DatabaseInitializer`) oluşturulan örnek kiracı ile uyumludur.

## 1. Ön Koşullar ve Varsayılan Test Verileri

| Varlık | Değer | Not |
| --- | --- | --- |
| Varsayılan Kiracı | `Agnostic Platform` (Domain: `platform.agnostic.local`) | `DatabaseInitializer` tarafından oluşturulur. |
| Varsayılan Kaynak (Mağaza) | `Ana Salon` | `TenantParameterKeys.Shop.*` parametreleriyle ilişkilidir. |
| Varsayılan Shop ID | `TenantParameterKeys.Shop.DefaultShopId` parametresinden okunur | EF Core InMemory modunda GUID runtime'da oluşur; API üzerinden sorgulanmalıdır. |
| Super User | E-posta: `super@agnostic.local`<br/>Parola: `ChangeMe!123` | Çok faktörlü doğrulama açık gelir. |
| Tenant Admin | E-posta: `admin@agnostic.local`<br/>Parola: `ChangeMe!123` | Çok faktörlü doğrulama açık gelir. |
| KVKK Zorunluluğu | `true` | `TenantParameterKeys.Auth.RequireKvkk` parametresi. |
| KVKK Metni | `KVKK metni için yer tutucu.` | Kullanıcı kayıt formunda gösterilmeli. |
| İki Faktör Zorunluluğu | `false` | Varsayılan olarak erişim belirteci hemen oluşturulur. |

> ℹ️ Üretilecek GUID değerleri için API çağrılarından dönen yanıtların saklanması önerilir; sonraki adımlarda (ör. rezervasyon oluşturma) aynı kimlikler kullanılacaktır.

## 2. Kimlik Doğrulama Senaryoları

### TC-AUTH-01 — Yönetici Kullanıcının Sisteme Girişi

* **Ön koşullar:** Super User hesabı mevcut.
* **Girdi verileri:**
  * `tenantId`: Varsayılan kiracının GUID değeri (`GET /api/admin/parameters?category=Shop` yanıtından alınabilir).
  * `email`: `super@agnostic.local`
  * `password`: `ChangeMe!123`
* **Adımlar:**
  1. `POST /api/auth/signin` uç noktasına yukarıdaki bilgilerle istekte bulunun.
  2. Yanıtta dönen `sessionData.tenant`, `sessionData.shop` ve `accessToken` alanlarını doğrulayın.
* **Beklenen sonuç:** HTTP 200; `twoFactorPending` alanı `false`, `accessToken` ve `refreshToken` dolu; `sessionData.user.roleName` `SuperUser` olmalı.

### TC-AUTH-02 — KVKK Onayı Olmadan Kayıt Girişiminin Reddedilmesi

* **Ön koşullar:** KVKK parametresi `true` olarak ayarlı.
* **Girdi verileri:**
  * `tenantId`: Varsayılan kiracı.
  * `email`: `deneme.kullanici@agnostic.local`
  * `password`: `P@ssword42`
  * `fullName`: `Deneme Kullanıcı`
  * `preferredTheme`: `agnostic-dark`
  * `preferredLanguage`: `tr-TR`
  * `acceptKvkk`: `false`
* **Adımlar:** `POST /api/auth/signup` isteğini gerçekleştirin.
* **Beklenen sonuç:** HTTP 400 veya 500 (uygulama konfigürasyonuna bağlı) hata kodu; mesaj `KVKK metni kabul edilmelidir` içermeli.

### TC-AUTH-03 — KVKK Onayı ile Yeni Kullanıcı Kaydı

* **Ön koşullar:** TC-AUTH-02 başarısız olmuştur.
* **Girdi verileri:** TC-AUTH-02 ile aynı fakat `acceptKvkk=true`.
* **Adımlar:** `POST /api/auth/signup` isteğini tekrarlayın.
* **Beklenen sonuç:** HTTP 201; `twoFactorPending` alanı `false`; `sessionData.user.roleName` `Admin`; kullanıcıya ait `id` saklanır.

### TC-AUTH-04 — Tema Güncelleme

* **Ön koşullar:** TC-AUTH-01 veya TC-AUTH-03 sonucunda elde edilmiş geçerli `userId`.
* **Girdi verileri:**
  * `userId`: Yukarıda alınan kullanıcı kimliği.
  * Gövde: `"agnostic-light"`
* **Adımlar:** `POST /api/auth/theme?userId={userId}` isteğini yapın.
* **Beklenen sonuç:** HTTP 204; tekrar `GET` ile kullanıcı çekildiğinde (`/api/admin/users` uç noktası gerekirse genişletilebilir) tema güncellenmiş olmalı.

## 3. Rezervasyon Yönetimi Senaryoları

### TC-RES-01 — Kaynak Uygunluğunu Listeleme

* **Ön koşullar:** Geçerli oturum (TC-AUTH-01).
* **Girdi verileri:**
  * `tenantId`: Varsayılan kiracı.
  * `resourceId`: `Ana Salon` kaynağının GUID değeri.
  * `start`: `2025-01-01`
  * `end`: `2025-01-07`
* **Adımlar:** `GET /api/reservations/availability` çağrısı yapın.
* **Beklenen sonuç:** HTTP 200; liste döner (başlangıçta boş olabilir).

### TC-RES-02 — Çakışmayan Rezervasyon Oluşturma

* **Ön koşullar:** TC-RES-01 tamamlanmış; aynı `tenantId` ve `resourceId` kullanılır.
* **Girdi verileri:**
  * `userId`: TC-AUTH-03 ile oluşturulan yeni kullanıcı veya super user.
  * `startUtc`: `2025-01-02T09:00:00Z`
  * `endUtc`: `2025-01-02T11:00:00Z`
* **Adımlar:** `POST /api/reservations` isteğini çalıştırın.
* **Beklenen sonuç:** HTTP 201; dönen nesnede `status` `Confirmed`; bildirim servisi loglarında `Reservation Confirmed` mesajı görülür.

### TC-RES-03 — Çakışan Rezervasyon Girişiminin Engellenmesi

* **Ön koşullar:** TC-RES-02 sonucu oluşan rezervasyon.
* **Girdi verileri:** TC-RES-02 ile aynı ancak `startUtc` ve `endUtc` çakışacak şekilde (`2025-01-02T10:00:00Z` - `2025-01-02T12:00:00Z`).
* **Adımlar:** `POST /api/reservations` isteğini tekrarlayın.
* **Beklenen sonuç:** HTTP 400/409; hata mesajı `Reservation conflict detected`.

### TC-RES-04 — Rezervasyon İptali

* **Ön koşullar:** TC-RES-02 sonucunda rezervasyon kimliği mevcut.
* **Girdi verileri:**
  * `id`: TC-RES-02'den dönen rezervasyon GUID'i.
  * `tenantId`: Varsayılan kiracı.
* **Adımlar:** `DELETE /api/reservations/{id}?tenantId={tenantId}` isteği.
* **Beklenen sonuç:** HTTP 204; takip eden uygunluk sorgusunda ilgili zaman aralığı tekrar müsait görünür; loglarda `Reservation Cancelled` mesajı çıkar.

## 4. Yönetim Parametreleri Senaryoları

### TC-PAR-01 — Parametre Listeleme ve Önbellek Doğrulaması

* **Ön koşullar:** TC-AUTH-01 oturumu; kullanıcı `SuperUser`.
* **Girdi verileri:** `tenantId` ve `category=Auth`.
* **Adımlar:**
  1. `GET /api/admin/parameters?tenantId={tenantId}&category=Auth` çağrısı.
  2. Aynı isteği tekrar çalıştırın.
* **Beklenen sonuç:** İlk çağrı verileri döndürür; ikinci çağrı için `ICacheService` üzerinden hit logu (örn. `MemoryCacheService`) gözlemlenir.

### TC-PAR-02 — Parametre Güncelleme (Onay Gerekmez)

* **Ön koşullar:** SuperUser rolü (`bypassApproval=true`).
* **Girdi verileri:**
  * `category=Auth`
  * `key=RequireTwoFactor`
  * `value=true`
  * `isSecret=false`
* **Adımlar:** `POST /api/admin/parameters?tenantId={tenantId}&category=Auth&key=RequireTwoFactor&isSecret=false&bypassApproval=true` isteği, gövde `"true"`.
* **Beklenen sonuç:** HTTP 200; `approvalRequired=false`; sonrasında `GET` çağrısı değeri `true` döner.

### TC-PAR-03 — Parametre Silme (Onaylı Süreç)

* **Ön koşullar:** Tenant Admin oturumu (`bypassApproval=false`).
* **Girdi verileri:** `parameterId`: Silinecek parametrenin GUID'i (ör. KVKK metni).
* **Adımlar:** `DELETE /api/admin/parameters/{parameterId}?tenantId={tenantId}` isteği.
* **Beklenen sonuç:** HTTP 200; `changeRequest` nesnesi döner ve `approvalRequired=true`; parametre veritabanında kalır, ancak onay kuyruğuna düşer.

### TC-PAR-04 — Parametre Önbelleğini Temizleme

* **Ön koşullar:** Herhangi bir oturum.
* **Adımlar:** `POST /api/admin/parameters/invalidate?tenantId={tenantId}`.
* **Beklenen sonuç:** HTTP 204; takip eden `GET` isteğinde veriler yeniden yüklenir (loglardan anlaşılır).

## 5. Lokalizasyon ve Bildirim Senaryoları

### TC-LOC-01 — Dil Güncelleme

* **Ön koşullar:** Geçerli kullanıcı kimliği.
* **Girdi verileri:** `language` gövdesi `"en-US"`.
* **Adımlar:** `POST /api/auth/language?userId={userId}` çağrısı.
* **Beklenen sonuç:** HTTP 204; kullanıcı kaydı güncellenir.

### TC-NOT-01 — Bildirim Servisi Kayıt Kontrolü

* **Ön koşullar:** TC-RES-02 veya TC-RES-04 adımlarında rezervasyon işlemi yapılmış olmalı.
* **Adımlar:** Uygulama loglarını inceleyerek `Dispatching Email notification` girdisinin oluştuğunu doğrulayın.
* **Beklenen sonuç:** Log girdisi ilgili rezervasyon kimliğini içerir.

## 6. Dashboard ve Loglama Senaryoları

### TC-DASH-01 — Dashboard Verilerinin Çekilmesi

* **Ön koşullar:** SuperUser oturumu.
* **Adımlar:** `GET /api/dashboard?tenantId={tenantId}` (gerçek uç nokta parametreleri doğrulanmalıdır).
* **Beklenen sonuç:** HTTP 200; widget listesi (`WidgetType`) boş dahi olsa başarılı yanıt dönmelidir.

### TC-LOG-01 — İstek Loglarının Listelenmesi

* **Ön koşullar:** Loglama etkin (`TenantParameterKeys.Logging.EnableGeneral=true`).
* **Adımlar:** `GET /api/admin/logs?tenantId={tenantId}` çağrısı.
* **Beklenen sonuç:** HTTP 200; önceki API çağrılarının kaydı listelenir.

## 7. Ek Notlar

* Testler sırasında kullanılan tüm GUID değerleri ve erişim belirteçleri, ilerideki adımlarda yeniden kullanılmak üzere kayıt altına alınmalıdır.
* Mobil ve web istemcileri üzerinden manuel test yapılırken aynı API senaryoları `Expo` veya `React Native Web` oturumları aracılığıyla tekrarlanabilir.
* Otomasyon yazarken, hata mesajlarının sabit metinlerini (`Invalid credentials`, `Reservation conflict detected`) doğrulayarak regresyon riskini azaltın.


# Uygulama Parametre Ekranları ve Yönetim Kılavuzu

Bu doküman, sektörden bağımsız rezervasyon platformu için rol bazlı yönetim panellerinde sunulacak parametre ekranlarını ve yönetim kurallarını açıklar.

## Rol Bazlı Yönetim Panelleri
- **Süper Kullanıcı (SuperUser)**: Yeni tenant açma, çapraz tenant ayarlarını düzenleme ve tüm parametre kategorilerine erişim için tam yetkiye sahiptir; `Permission` enum’undaki tüm bayrakları içerir.【F:src/Server/AgnosticReservation.Domain/Enums/Permission.cs†L3-L16】
- **Tenant Yöneticisi (TenantAdmin)**: Kendi tenant’ındaki kullanıcı, bildirim ve parametre ayarlarını yönetir; rezervasyon, stok ve fatura yönetimine izin veren izin bileşimine sahiptir.【F:src/Server/AgnosticReservation.Domain/Entities/Role.cs†L5-L37】【F:src/Server/AgnosticReservation.Domain/Enums/Permission.cs†L7-L15】
- **Dükkan Yöneticisi (ShopAdmin)**: Mağaza/lot kaynaklarını (`Resource`) yönetir, çalışan ataması ve rezervasyon akışlarını denetler.【F:src/Server/AgnosticReservation.Domain/Entities/Resource.cs†L3-L20】
- **Dükkan Çalışanı (ShopStaff)**: Rezervasyon chart’larını izler, rezervasyon taleplerini kabul/iptal eder; `ReservationsController` üzerinden ilgili uç noktaları kullanır.【F:src/Server/AgnosticReservation.Api/Controllers/ReservationsController.cs†L7-L37】
- **Muhasebe (Accounting)**: Ödeme ve faturalandırma parametrelerine erişir, rezervasyon iptal cezalarını kontrol eder; bu bilgiler `billing` kategorisindeki parametrelerde tutulur.【F:src/Server/AgnosticReservation.Domain/Entities/TenantParameter.cs†L3-L28】
- **Müşteri (Customer)**: Rezervasyon talebi oluşturur, bildirimleri alır ve izin verilen kurallar dahilinde iptal eder; bildirimler NotificationService tarafından tetiklenir.【F:src/Server/AgnosticReservation.Infrastructure/Services/ReservationService.cs†L24-L56】【F:src/Server/AgnosticReservation.Infrastructure/Services/NotificationService.cs†L7-L21】

Her rol, kendi panelinde yalnızca izinli kategorileri görür. Panel navigasyonu React Native istemcilerinde rol bazlı olarak yönetilir.【F:docs/README.md†L29-L34】

## Parametre Kategorileri
Parametreler `TenantParameter` tablosunda kategori/anahtar ikilisi ile saklanır ve UI katmanı tarafından JSON formatında işlenebilir.【F:src/Server/AgnosticReservation.Domain/Entities/TenantParameter.cs†L3-L28】 Tüm CRUD operasyonları `IParameterService` üzerinden yapılır ve sonuçlar tenant bazlı önbelleğe alınır.【F:src/Server/AgnosticReservation.Application/Admin/IParameterService.cs†L5-L10】【F:src/Server/AgnosticReservation.Infrastructure/Services/ParameterService.cs†L7-L65】

### 1. UI Theme Yönetimi (`ui.theme`)
- **Kapsam**: Tema paleti, layout seçenekleri, bileşen görünürlükleri.
- **JSON Şeması Örneği**:
  ```json
  {
    "palette": { "primary": "#4ade80", "secondary": "#22d3ee", "background": "#0f172a" },
    "layout": { "chart": "occupancy", "showWaitlist": true }
  }
  ```
- **İş Akışı**: Tenant yöneticisi temayı güncellediğinde `AuthController` aracılığıyla kullanıcı temaları da eş zamanlı olarak güncellenebilir; tenant varsayılanı `Tenant.DefaultTheme` alanında saklanır.【F:src/Server/AgnosticReservation.Api/Controllers/AuthController.cs†L7-L37】【F:src/Server/AgnosticReservation.Domain/Entities/Tenant.cs†L3-L28】【F:src/Server/AgnosticReservation.Domain/Entities/User.cs†L5-L49】

### 2. Rezervasyon Kuralları (`reservation.rules`)
- **Kapsam**: İptal süresi, bekleme listesi, kapasite toleransı.
- **Kullanım**: Dükkan çalışanı paneli bu parametreleri okuyarak chart üzerindeki talepleri işleyip hangi rezervasyonların kabul edileceğini belirler. `ReservationService` çakışma kontrolü ve iptal işlemlerini otomatik yürütür; parametre ekranı bu kuralları düzenlemek için arka uç servislerine JSON gönderir.【F:src/Server/AgnosticReservation.Infrastructure/Services/ReservationService.cs†L24-L56】

### 3. Bildirim Kanalları (`notifications`)
- **Kapsam**: E-posta, SMS, push tercihleri, SignalR kanal ayarları.
- **Kullanım**: Tenant yöneticisi bildirim kombinasyonlarını günceller; NotificationService varsayılan olarak log’a yazar, gerçek sağlayıcılara yönlendirmek için aynı sözleşme genişletilir.【F:src/Server/AgnosticReservation.Infrastructure/Services/NotificationService.cs†L7-L21】

### 4. Faturalandırma ve Ödeme (`billing`)
- **Kapsam**: POS kullanımı, çevrimiçi ödeme zorunluluğu, iptal ücretleri.
- **Kullanım**: Muhasebe paneli bu parametrelerle raporlama ve tahsilat kurallarını belirler; rezervasyon iptali sırasında uygulanacak cezalar bu verilerden okunur.【F:src/Server/AgnosticReservation.Infrastructure/Services/ReservationService.cs†L39-L56】

## Önbellek ve Senkronizasyon
Parametre değişiklikleri sonrasında `AdminCacheController` üzerinden tenant önbelleği temizlenmelidir; servis, tüm tenant anahtarlarını önek bazlı olarak siler.【F:src/Server/AgnosticReservation.Api/Controllers/AdminCacheController.cs†L6-L21】【F:src/Server/AgnosticReservation.Infrastructure/Services/InMemoryCacheService.cs†L6-L42】 UI tarafı, temizleme işlemi sonrası `IParameterService` üzerinden güncel veriyi çeker.【F:src/Server/AgnosticReservation.Infrastructure/Services/ParameterService.cs†L18-L65】

## Rezervasyon Bildirim Akışı
Müşteri talebi oluşturduğunda rezervasyon servisinde çakışma denetimi yapılır, onaylanan rezervasyon için bildirim tetiklenir. Çalışan paneli chart bileşeninde yeni talebi görür, kabul sonrası müşteri bildirilir; iptal durumunda da aynı servis akışı geçerlidir.【F:src/Server/AgnosticReservation.Api/Controllers/ReservationsController.cs†L18-L37】【F:src/Server/AgnosticReservation.Infrastructure/Services/ReservationService.cs†L24-L56】

## Tema ve Kullanıcı Tercihlerinin Senkronizasyonu
Kullanıcı bazlı tema tercihleri `AuthController.UpdateTheme` uç noktası ile güncellenir; bu değerler `User.PreferredTheme` alanında saklanır ve tenant varsayılanı ile birlikte UI tarafından kullanılır.【F:src/Server/AgnosticReservation.Api/Controllers/AuthController.cs†L32-L36】【F:src/Server/AgnosticReservation.Domain/Entities/User.cs†L25-L49】【F:src/Server/AgnosticReservation.Domain/Entities/Tenant.cs†L19-L28】

Bu yapı sayesinde her sektör, tenant ve mağaza için özelleştirilebilir, JSON tabanlı tema ve politika yönetimi yapılır; rollere göre ayrışmış paneller sayesinde karmaşık iş akışları sade bir şekilde yönetilir.

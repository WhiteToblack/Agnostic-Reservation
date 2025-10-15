# Teknik Analiz

## Monorepo Genel Yapısı
Proje, .NET 8 tabanlı çok katmanlı bir arka uç ile React Native istemcilerini aynı depo altında barındıran monorepo yaklaşımını kullanır.【F:docs/README.md†L1-L56】 `src/Server` dizini API, Application, Domain ve Infrastructure katmanlarını içerirken; `apps/mobile` ve `apps/web` rollere göre özelleştirilebilen istemci uygulamalarını barındırır.【F:docs/README.md†L5-L33】

## Domain Katmanı
- **Tenant**: Kiracı adı, domain ve varsayılan tema bilgisiyle birlikte kullanıcı, parametre ve doküman koleksiyonlarını barındırır; tema güncellemeleri doğrudan tenant üzerinde tutulur.【F:src/Server/AgnosticReservation.Domain/Entities/Tenant.cs†L3-L28】
- **TenantParameter**: Kategori ve anahtar bazlı yapılandırma değerlerini saklayarak JSON temaları, rezervasyon kuralları gibi özelleştirmeleri mümkün kılar.【F:src/Server/AgnosticReservation.Domain/Entities/TenantParameter.cs†L3-L28】
- **Role & Permission**: Yetkiler `Permission` enum’undaki bayraklar ile tanımlanır; roller her bir izin için `RolePermission` kaydı oluşturur.【F:src/Server/AgnosticReservation.Domain/Entities/Role.cs†L5-L37】【F:src/Server/AgnosticReservation.Domain/Enums/Permission.cs†L3-L16】
- **User**: Tenant ve rol referanslarıyla tema tercihi, MFA bilgisi ve bildirim tercihlerini taşır; yönetim panelleri tema değişimini doğrudan kullanıcı düzeyinde işleyebilir.【F:src/Server/AgnosticReservation.Domain/Entities/User.cs†L5-L49】
- **UserProfiles & UserPaymentMethods**: Misafirlerin iletişim ve faturalandırma verileri `UserProfiles` ve `UserPaymentMethods` tablolarında tutulur; destek ekipleri bu alanları admin arayüzünden güncelleyecek şekilde indekslenmiştir.【F:docs/sql/agnostic_reservation_mssql.sql†L101-L151】
- **UserSupportTickets**: Admin destek paneliyle entegre çalışan yeni tablo; kiracı ve kullanıcı bazlı destek kayıtlarının durum, kanal ve zaman bilgisini izler.【F:docs/sql/agnostic_reservation_mssql.sql†L153-L178】
- **Resource & Reservation**: Kaynaklar tenant’a bağlı mağaza/lot kavramını temsil ederken, rezervasyonlar zaman aralığı doğrulaması ve iptal yetenekleriyle oluşturulur.【F:src/Server/AgnosticReservation.Domain/Entities/Resource.cs†L3-L20】【F:src/Server/AgnosticReservation.Domain/Entities/Reservation.cs†L5-L34】

## Application Katmanı
- **IParameterService** tenant parametrelerinin listelenmesi, güncellenmesi ve önbelleğinin temizlenmesi için sözleşmeler sunar.【F:src/Server/AgnosticReservation.Application/Admin/IParameterService.cs†L5-L10】
- **IReservationService** rezervasyon müsaitlik, oluşturma ve iptal işlemlerini kapsar; mağaza çalışanı ve müşteri panellerindeki akışların temelini oluşturur.【F:src/Server/AgnosticReservation.Application/Reservations/IReservationService.cs†L6-L10】

## Infrastructure Katmanı
- **ParameterService** parametreleri önce tenant bazlı önbellekten okur, yoksa depodan yükler; güncelleme ve silme işlemlerinden sonra tüm tenant önbelleğini temizler.【F:src/Server/AgnosticReservation.Infrastructure/Services/ParameterService.cs†L7-L65】
- **InMemoryCacheService** anahtarları tenant önekleriyle saklayıp süre sonu kontrolü yapar; Redis gibi harici sağlayıcılarla değiştirilmek üzere soyutlanmıştır.【F:src/Server/AgnosticReservation.Infrastructure/Services/InMemoryCacheService.cs†L6-L42】
- **ReservationService** kaynak doğrulaması yapar, çakışan rezervasyonları engeller ve onay/iptal işlemlerinde bildirim servisini tetikler; SignalR entegrasyonuna hazır bildirim akışının iş kurallarını içerir.【F:src/Server/AgnosticReservation.Infrastructure/Services/ReservationService.cs†L11-L56】
- **AuthService** SHA-256 tabanlı Base64 hash kullanarak kullanıcı doğrular, yeni kullanıcıları tenant ve rollerle ilişkilendirir, tema güncelleme çağrılarını destekler.【F:src/Server/AgnosticReservation.Infrastructure/Services/AuthService.cs†L11-L70】
- **NotificationService** varsayılan olarak log tabanlı bildirimler üretir; e-posta/SMS/push için genişletilebilir bir strateji noktası sunar.【F:src/Server/AgnosticReservation.Infrastructure/Services/NotificationService.cs†L7-L21】

## API Katmanı
- **AuthController** oturum açma/kayıt ve kullanıcı tema güncellemelerini expose eder; tenant bazlı tema yönetimi için temel uç noktadır.【F:src/Server/AgnosticReservation.Api/Controllers/AuthController.cs†L7-L37】
- **AdminParametersController** tenant parametrelerini sorgulama, güncelleme ve silme işlemlerini sağlar; parametre ekranlarının arka uç desteğini sunar.【F:src/Server/AgnosticReservation.Api/Controllers/AdminParametersController.cs†L6-L43】
- **AdminCacheController** tenant önbelleğini temizleyen uç noktayla parametre değişikliklerinin anında yansımasını sağlar.【F:src/Server/AgnosticReservation.Api/Controllers/AdminCacheController.cs†L6-L21】
- **ReservationsController** mağaza çalışanı ve müşterilerin rezervasyon oluşturma/iptal akışlarına hizmet eder.【F:src/Server/AgnosticReservation.Api/Controllers/ReservationsController.cs†L7-L37】

## Bağımlılık Kayıtları
Tüm servisler `AddAgnosticReservationModules` uzantısında DI konteynerine eklenir; Repository, Auth, Parameter, Cache, Notification, Reservation ve Dashboard servisleri burada yapılandırılır.【F:src/Server/AgnosticReservation.Api/Modules/ServiceCollectionExtensions.cs†L12-L27】

## Testler
`ReservationServiceTests`, çakışan rezervasyon durumunda uygulamanın hata fırlattığını doğrulamak için bellek içi EF Core bağlamını kullanır; bu senaryo çalışan panellerinin eş zamanlı isteklerini güvence altına alır.【F:src/Tests/AgnosticReservation.Tests/ReservationServiceTests.cs†L1-L36】

## İstemci Yansımaları
Mobil ve web istemcileri paylaşımlı komponent kütüphanesi üzerinden aynı tema ve widget yapılandırmalarını kullanır; rol bazlı dashboard ve admin ekranları React Native üzerinden servis edilir.【F:docs/README.md†L29-L34】

- Web istemcisinin admin alanına destek konsolu eklendi; operatorler tenant seçimine göre misafir profillerini arayıp iletişim, faturalandırma ve destek notlarını canlı olarak düzenleyebiliyor.【F:apps/web/src/components/AdminSupportPanel.tsx†L1-L263】
- Misafir dashboard’undaki profil sekmesi artık telefon, adres ve ödeme bilgilerini düzenlenebilir formda sunuyor; kayıtlar admin paneliyle aynı veri modelini kullanacak şekilde `RegisteredUser` tipine eklendi.【F:apps/web/src/components/UserDashboard.tsx†L1-L382】【F:apps/web/src/types/domain.ts†L1-L33】

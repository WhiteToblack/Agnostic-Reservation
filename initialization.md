# İlk Kurulum ve Örnek Veri Yükleme Rehberi

Bu doküman, çok kiracılı rezervasyon platformunun çalıştırılması ve tüm rolleri kapsayan örnek verilerin veri tabanına yüklenmesi için gerekli adımları özetler.

## 1. Ön Koşullar
- .NET 8 SDK ve Node.js 18+ kurulu olmalıdır.
- Monorepo yapısı ve bileşenleri için `docs/README.md` dosyasındaki özet ve kurulum yönergelerini izleyin.【F:docs/README.md†L1-L56】

## 2. Sunucu ve İstemci Uygulamalarını Başlatma
1. **Backend API**
   ```bash
   dotnet restore src/Server/AgnosticReservation.sln
   dotnet build src/Server/AgnosticReservation.sln
   dotnet run --project src/Server/AgnosticReservation.Api/AgnosticReservation.Api.csproj
   ```
2. **Mobil istemci**
   ```bash
   cd apps/mobile
   npm install
   npm run start
   ```
3. **Web istemci**
   ```bash
   cd apps/web
   npm install
   npm run web
   ```
Kurulum komutları doğrudan proje dokümantasyonundan alınmıştır.【F:docs/README.md†L35-L56】

## 3. Veritabanı Hazırlığı
1. SQL Server üzerinde `docs/sql/agnostic_reservation_mssql.sql` betiğini çalıştırarak tüm şema nesnelerini oluşturun.【F:docs/README.md†L66-L81】
2. EF Core göçlerini yönetmek için dokümandaki `dotnet ef` komutlarını kullanın (AppDbContext Infrastructure katmanındadır).【F:docs/README.md†L66-L81】

## 4. Redis (Opsiyonel) Kurulumu
Varsayılan olarak `ICacheService` için bellek içi uygulama gelir; tenant parametreleri gibi yönetimsel değerleri Redis üzerinde saklamak için bu servisi Redis sürümüyle değiştirin.【F:docs/README.md†L18-L27】【F:src/Server/AgnosticReservation.Infrastructure/Services/ParameterService.cs†L7-L65】

## 5. Çok Kiracılı Başlangıç Verisi
Aşağıdaki betik, tüm roller için örnek kayıtlar, iki farklı sektör (Spor Salonu ve Ortak Çalışma Alanı) için tenant ve tema parametreleri ile mağaza bazlı kaynaklar oluşturur. Parola hash değerleri, AuthService içinde kullanılan SHA-256 tabanlı Base64 formatıyla uyumludur.【F:src/Server/AgnosticReservation.Infrastructure/Services/AuthService.cs†L24-L68】

> Not: Betikte `PreferredChannel` alanları, varsayılan bildirim kanalını e-posta olarak ayarlamak için `1` (NotificationChannel.Email) değeri ile doldurulmuştur.【F:src/Server/AgnosticReservation.Domain/Entities/User.cs†L5-L49】【F:src/Server/AgnosticReservation.Infrastructure/Services/ReservationService.cs†L39-L56】

```sql
USE AgnosticReservation;
GO

DECLARE @Now DATETIME2(7) = SYSUTCDATETIME();

-- Rol tanımları
DECLARE @RoleSuperUser UNIQUEIDENTIFIER = NEWID();
DECLARE @RoleTenantAdmin UNIQUEIDENTIFIER = NEWID();
DECLARE @RoleShopAdmin UNIQUEIDENTIFIER = NEWID();
DECLARE @RoleShopStaff UNIQUEIDENTIFIER = NEWID();
DECLARE @RoleAccounting UNIQUEIDENTIFIER = NEWID();
DECLARE @RoleCustomer UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.Roles (Id, Name, CreatedAt)
VALUES
    (@RoleSuperUser, 'SuperUser', @Now),
    (@RoleTenantAdmin, 'TenantAdmin', @Now),
    (@RoleShopAdmin, 'ShopAdmin', @Now),
    (@RoleShopStaff, 'ShopStaff', @Now),
    (@RoleAccounting, 'Accounting', @Now),
    (@RoleCustomer, 'Customer', @Now);

-- İzinler (Permission enum değerleri)
INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES
    (NEWID(), @RoleSuperUser, 1, @Now),  -- ViewDashboard
    (NEWID(), @RoleSuperUser, 2, @Now),  -- ManageReservations
    (NEWID(), @RoleSuperUser, 4, @Now),  -- ManageTenants
    (NEWID(), @RoleSuperUser, 8, @Now),  -- ManageParameters
    (NEWID(), @RoleSuperUser, 16, @Now), -- ManageDocuments
    (NEWID(), @RoleSuperUser, 32, @Now), -- ManageUsers
    (NEWID(), @RoleSuperUser, 64, @Now), -- ManageNotifications
    (NEWID(), @RoleSuperUser, 128, @Now),-- ManageInventory
    (NEWID(), @RoleSuperUser, 256, @Now),-- ManageBilling

    (NEWID(), @RoleTenantAdmin, 1, @Now),
    (NEWID(), @RoleTenantAdmin, 2, @Now),
    (NEWID(), @RoleTenantAdmin, 8, @Now),
    (NEWID(), @RoleTenantAdmin, 16, @Now),
    (NEWID(), @RoleTenantAdmin, 32, @Now),
    (NEWID(), @RoleTenantAdmin, 64, @Now),
    (NEWID(), @RoleTenantAdmin, 128, @Now),
    (NEWID(), @RoleTenantAdmin, 256, @Now),

    (NEWID(), @RoleShopAdmin, 1, @Now),
    (NEWID(), @RoleShopAdmin, 2, @Now),
    (NEWID(), @RoleShopAdmin, 16, @Now),
    (NEWID(), @RoleShopAdmin, 128, @Now),

    (NEWID(), @RoleShopStaff, 1, @Now),
    (NEWID(), @RoleShopStaff, 2, @Now),

    (NEWID(), @RoleAccounting, 1, @Now),
    (NEWID(), @RoleAccounting, 256, @Now),

    (NEWID(), @RoleCustomer, 1, @Now);

-- Tenant tanımları
DECLARE @TenantWellness UNIQUEIDENTIFIER = NEWID();
DECLARE @TenantCowork UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.Tenants (Id, Name, Domain, DefaultTheme, CreatedAt)
VALUES
    (@TenantWellness, 'Wellness Collective', 'wellness.example.com', 'wellness-dark', @Now),
    (@TenantCowork, 'Artisan CoWork', 'cowork.example.com', 'cowork-light', @Now);

-- Kullanıcılar
DECLARE @UserSuper UNIQUEIDENTIFIER = NEWID();
DECLARE @UserTenantAdmin UNIQUEIDENTIFIER = NEWID();
DECLARE @UserShopAdmin UNIQUEIDENTIFIER = NEWID();
DECLARE @UserShopStaff UNIQUEIDENTIFIER = NEWID();
DECLARE @UserAccounting UNIQUEIDENTIFIER = NEWID();
DECLARE @UserCustomer UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, PreferredTheme, MultiFactorEnabled, CreatedAt)
VALUES
    (@UserSuper, @TenantWellness, @RoleSuperUser, 'super@platform.io', 'yq87SQNKtzrmQSYFaF825g9jh3iHNNmPRlLOtEZuees=', 'inherit', 1, @Now),
    (@UserTenantAdmin, @TenantWellness, @RoleTenantAdmin, 'admin@wellness.example.com', 'rrp5x3D4Qc+7+Z7oS4HyPpd7iozYz93Xy27olxVrLFk=', 'wellness-dark', 1, @Now),
    (@UserShopAdmin, @TenantWellness, @RoleShopAdmin, 'studio@wellness.example.com', '8GfC5GvuMdi0GG8gGskrvFonWFrU6Eyk4O9fk7gmfIc=', 'wellness-dark', 0, @Now),
    (@UserShopStaff, @TenantWellness, @RoleShopStaff, 'trainer@wellness.example.com', 'ZfGL/sOSHGX2KLoXIzJtl/OCQXvGw5+04vkWxNzbmRI=', 'inherit', 0, @Now),
    (@UserAccounting, @TenantCowork, @RoleAccounting, 'finance@cowork.example.com', 'aOjniB/G0zOwsJKNBIhzWZuMXMmp4Qs+BC7ito5zA1g=', 'cowork-light', 0, @Now),
    (@UserCustomer, @TenantCowork, @RoleCustomer, 'member@cowork.example.com', 'mOxlSo3yj48PjwIiBIPUaRa4UBfeC3TY7HVcKMuFOag=', 'inherit', 0, @Now);

INSERT INTO dbo.NotificationPreferences (Id, UserId, PushEnabled, EmailEnabled, SmsEnabled, PreferredChannel, CreatedAt)
VALUES
    (NEWID(), @UserSuper, 1, 1, 0, 1, @Now),
    (NEWID(), @UserTenantAdmin, 1, 1, 0, 1, @Now),
    (NEWID(), @UserShopAdmin, 1, 1, 1, 1, @Now),
    (NEWID(), @UserShopStaff, 1, 1, 0, 1, @Now),
    (NEWID(), @UserAccounting, 0, 1, 0, 1, @Now),
    (NEWID(), @UserCustomer, 1, 1, 0, 1, @Now);

-- Kaynaklar (dükkan/lot karşılıkları)
DECLARE @ResourceYoga UNIQUEIDENTIFIER = NEWID();
DECLARE @ResourcePilates UNIQUEIDENTIFIER = NEWID();
DECLARE @ResourceMeeting UNIQUEIDENTIFIER = NEWID();
DECLARE @ResourceWorkshop UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.Resources (Id, TenantId, Name, Capacity, CreatedAt)
VALUES
    (@ResourceYoga, @TenantWellness, N'Yoga Stüdyosu', 15, @Now),
    (@ResourcePilates, @TenantWellness, N'Pilates Salonu', 10, @Now),
    (@ResourceMeeting, @TenantCowork, N'Cam Toplantı Odası', 8, @Now),
    (@ResourceWorkshop, @TenantCowork, N'Atölye Alanı', 20, @Now);

-- Tema ve politika parametreleri (JSON)
INSERT INTO dbo.TenantParameters (Id, TenantId, Category, [Key], [Value], IsSecret, CreatedAt)
VALUES
    (NEWID(), @TenantWellness, 'ui.theme', 'palette', N'{"primary":"#4ade80","secondary":"#22d3ee","background":"#0f172a"}', 0, @Now),
    (NEWID(), @TenantWellness, 'ui.theme', 'layout', N'{"chart":"occupancy","showWaitlist":true}', 0, @Now),
    (NEWID(), @TenantWellness, 'reservation.rules', 'cancellation', N'{"windowHours":6,"lateFee":35,"allowWaitlist":true}', 0, @Now),
    (NEWID(), @TenantWellness, 'billing', 'paymentOptions', N'{"online":true,"pos":true,"installments":false}', 0, @Now),

    (NEWID(), @TenantCowork, 'ui.theme', 'palette', N'{"primary":"#0ea5e9","secondary":"#6366f1","background":"#f8fafc"}', 0, @Now),
    (NEWID(), @TenantCowork, 'ui.theme', 'layout', N'{"chart":"utilization","showWaitlist":false}', 0, @Now),
    (NEWID(), @TenantCowork, 'reservation.rules', 'cancellation', N'{"windowHours":2,"lateFee":15,"allowWaitlist":false}', 0, @Now),
    (NEWID(), @TenantCowork, 'billing', 'paymentOptions', N'{"online":true,"pos":false,"installments":true}', 0, @Now),
    (NEWID(), @TenantCowork, 'notifications', 'channels', N'{"email":true,"sms":true,"push":true}', 0, @Now);
GO
```

## 6. Parametre Önbelleğini Temizleme
Parametre güncellemeleri sonrası tenant bazlı önbelleği temizlemek için `api/admin/cache?tenantId={id}` uç noktasını çağırabilirsiniz; bu uç nokta tüm tenant parametre anahtarlarını temizler.【F:src/Server/AgnosticReservation.Api/Controllers/AdminCacheController.cs†L6-L21】【F:src/Server/AgnosticReservation.Infrastructure/Services/ParameterService.cs†L18-L65】

## 7. Rezervasyon Akışını Test Etme
1. `api/reservations` uç noktasına müşteri kullanıcı bilgileriyle POST isteği atarak rezervasyon talebi oluşturun.【F:src/Server/AgnosticReservation.Api/Controllers/ReservationsController.cs†L9-L35】
2. Çakışma kontrolleri ve bildirimler, rezervasyon servisi tarafından otomatik yapılır.【F:src/Server/AgnosticReservation.Infrastructure/Services/ReservationService.cs†L24-L56】
3. Onaylanan rezervasyonu iptal etmek için DELETE çağrısı yapabilirsiniz; bu işlem statüyü günceller ve bildirim gönderir.【F:src/Server/AgnosticReservation.Domain/Entities/Reservation.cs†L6-L29】【F:src/Server/AgnosticReservation.Infrastructure/Services/ReservationService.cs†L45-L56】

Bu adımlar tamamlandığında tüm rollere özel yönetim panelleri ve müşteri deneyimi için hazır bir başlangıç verisi elde etmiş olursunuz.

USE AgnosticReservation;
GO

DECLARE @Now DATETIME2(7) = SYSUTCDATETIME();

DECLARE @RoleTenantAdmin UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Name = 'TenantAdmin');
DECLARE @RoleShopAdmin UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Name = 'ShopAdmin');
DECLARE @RoleShopStaff UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Name = 'ShopStaff');
DECLARE @RoleAccounting UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Name = 'Accounting');
DECLARE @RoleCustomer UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Name = 'Customer');

IF @RoleTenantAdmin IS NULL OR @RoleShopAdmin IS NULL OR @RoleShopStaff IS NULL OR @RoleAccounting IS NULL OR @RoleCustomer IS NULL
BEGIN
    THROW 50000, 'Gerekli roller bulunamadı. Lütfen temel tohumlama betiklerini çalıştırdıktan sonra yeniden deneyin.', 1;
END;

/* Yardımcı makrolar */
DECLARE @EmailChannel INT = 1;

/* -------------------------------------------------------------------------- */
/* Beauty & Wellness Collective                                               */
/* -------------------------------------------------------------------------- */
DECLARE @TenantBeauty UNIQUEIDENTIFIER;
SELECT @TenantBeauty = Id FROM dbo.Tenants WHERE Domain = 'beauty.agnostic.test';
IF @TenantBeauty IS NULL
BEGIN
    SET @TenantBeauty = NEWID();
    INSERT INTO dbo.Tenants (Id, Name, Domain, DefaultTheme, CreatedAt)
    VALUES (@TenantBeauty, N'Beauty & Wellness Collective', 'beauty.agnostic.test', 'beauty-blush', @Now);
END;

DECLARE @BeautySalon UNIQUEIDENTIFIER;
SELECT @BeautySalon = Id FROM dbo.Resources WHERE TenantId = @TenantBeauty AND Name = N'Güzellik Stüdyosu';
IF @BeautySalon IS NULL
BEGIN
    SET @BeautySalon = NEWID();
    INSERT INTO dbo.Resources (Id, TenantId, Name, Capacity, CreatedAt)
    VALUES (@BeautySalon, @TenantBeauty, N'Güzellik Stüdyosu', 12, @Now);
END;

DECLARE @BeautyClinic UNIQUEIDENTIFIER;
SELECT @BeautyClinic = Id FROM dbo.Resources WHERE TenantId = @TenantBeauty AND Name = N'Cilt Bakım Kliniği';
IF @BeautyClinic IS NULL
BEGIN
    SET @BeautyClinic = NEWID();
    INSERT INTO dbo.Resources (Id, TenantId, Name, Capacity, CreatedAt)
    VALUES (@BeautyClinic, @TenantBeauty, N'Cilt Bakım Kliniği', 8, @Now);
END;

DECLARE @BeautyAdmin UNIQUEIDENTIFIER;
SELECT @BeautyAdmin = Id FROM dbo.Users WHERE Email = 'admin@beauty.agnostic.test';
IF @BeautyAdmin IS NULL
BEGIN
    SET @BeautyAdmin = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@BeautyAdmin, @TenantBeauty, @RoleTenantAdmin, 'admin@beauty.agnostic.test', 'ldQXbZpb9QOK3ED2vDH9cyDjPCdh5ZEPiCpUzZ74yOE=', N'Elif Kaya', 'beauty-blush', 1, @Now);
END;

DECLARE @BeautyShopAdmin UNIQUEIDENTIFIER;
SELECT @BeautyShopAdmin = Id FROM dbo.Users WHERE Email = 'studio@beauty.agnostic.test';
IF @BeautyShopAdmin IS NULL
BEGIN
    SET @BeautyShopAdmin = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@BeautyShopAdmin, @TenantBeauty, @RoleShopAdmin, 'studio@beauty.agnostic.test', 'LGRCIPVd8VSPw5gyiq98rlSQT81P7f3t4g7ks3w0/Dg=', N'Seda Demir', 'beauty-blush', 0, @Now);
END;

DECLARE @BeautyShopStaff UNIQUEIDENTIFIER;
SELECT @BeautyShopStaff = Id FROM dbo.Users WHERE Email = 'staff@beauty.agnostic.test';
IF @BeautyShopStaff IS NULL
BEGIN
    SET @BeautyShopStaff = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@BeautyShopStaff, @TenantBeauty, @RoleShopStaff, 'staff@beauty.agnostic.test', 'Bd1KE3anLZpeD60yAA9+YWUaXO9cnJoMOBbHRD2vv28=', N'Canan Arslan', 'inherit', 0, @Now);
END;

DECLARE @BeautyAccounting UNIQUEIDENTIFIER;
SELECT @BeautyAccounting = Id FROM dbo.Users WHERE Email = 'finance@beauty.agnostic.test';
IF @BeautyAccounting IS NULL
BEGIN
    SET @BeautyAccounting = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@BeautyAccounting, @TenantBeauty, @RoleAccounting, 'finance@beauty.agnostic.test', 'nu6tHiXZdSEW16a7BkrYLvaNVOXyN1plxrvm2yyFqoo=', N'Hakan Er', 'beauty-blush', 0, @Now);
END;

DECLARE @BeautyCustomer1 UNIQUEIDENTIFIER;
SELECT @BeautyCustomer1 = Id FROM dbo.Users WHERE Email = 'ayse.customer@beauty.agnostic.test';
IF @BeautyCustomer1 IS NULL
BEGIN
    SET @BeautyCustomer1 = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@BeautyCustomer1, @TenantBeauty, @RoleCustomer, 'ayse.customer@beauty.agnostic.test', 'b5ryb2L3VovuHm+ElZRUeoz9+QRJb6sZze5xkqLCtTg=', N'Ayşe Yılmaz', 'inherit', 0, @Now);
END;

DECLARE @BeautyCustomer2 UNIQUEIDENTIFIER;
SELECT @BeautyCustomer2 = Id FROM dbo.Users WHERE Email = 'melis.customer@beauty.agnostic.test';
IF @BeautyCustomer2 IS NULL
BEGIN
    SET @BeautyCustomer2 = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@BeautyCustomer2, @TenantBeauty, @RoleCustomer, 'melis.customer@beauty.agnostic.test', 'b5ryb2L3VovuHm+ElZRUeoz9+QRJb6sZze5xkqLCtTg=', N'Melis Karaca', 'inherit', 0, @Now);
END;

MERGE dbo.NotificationPreferences AS target
USING (VALUES
    (@BeautyAdmin, 1, 1, 0),
    (@BeautyShopAdmin, 1, 1, 1),
    (@BeautyShopStaff, 1, 1, 0),
    (@BeautyAccounting, 0, 1, 0),
    (@BeautyCustomer1, 1, 1, 0),
    (@BeautyCustomer2, 1, 1, 0)
) AS source(UserId, PushEnabled, EmailEnabled, SmsEnabled)
ON target.UserId = source.UserId
WHEN MATCHED THEN
    UPDATE SET PushEnabled = source.PushEnabled,
               EmailEnabled = source.EmailEnabled,
               SmsEnabled = source.SmsEnabled,
               PreferredChannel = @EmailChannel,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, PushEnabled, EmailEnabled, SmsEnabled, PreferredChannel, CreatedAt)
    VALUES (NEWID(), source.UserId, source.PushEnabled, source.EmailEnabled, source.SmsEnabled, @EmailChannel, @Now);
;

MERGE dbo.UserProfiles AS target
USING (VALUES
    (@BeautyCustomer1, N'+90 532 000 12 34', N'İstiklal Caddesi No:56', N'Daire 7', N'İstanbul', N'Türkiye', N'34000'),
    (@BeautyCustomer2, N'+90 533 111 22 33', N'Bebek Mahallesi No:18', NULL, N'İstanbul', N'Türkiye', N'34342')
) AS source(UserId, PhoneNumber, AddressLine1, AddressLine2, City, Country, PostalCode)
ON target.UserId = source.UserId
WHEN MATCHED THEN
    UPDATE SET PhoneNumber = source.PhoneNumber,
               AddressLine1 = source.AddressLine1,
               AddressLine2 = source.AddressLine2,
               City = source.City,
               Country = source.Country,
               PostalCode = source.PostalCode,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, PhoneNumber, AddressLine1, AddressLine2, City, Country, PostalCode, CreatedAt)
    VALUES (NEWID(), source.UserId, source.PhoneNumber, source.AddressLine1, source.AddressLine2, source.City, source.Country, source.PostalCode, @Now);
;

MERGE dbo.UserPaymentMethods AS target
USING (VALUES
    (@BeautyCustomer1, N'Ayşe Yılmaz', N'VISA', N'4242', N'08', N'27', N'İstiklal Caddesi No:56 Daire 7', N'İstanbul', N'Türkiye', N'34000'),
    (@BeautyCustomer2, N'Melis Karaca', N'Mastercard', N'5522', N'11', N'26', N'Bebek Mahallesi No:18', N'İstanbul', N'Türkiye', N'34342')
) AS source(UserId, CardHolderName, CardBrand, CardLast4, ExpiryMonth, ExpiryYear, BillingAddress, BillingCity, BillingCountry, BillingPostalCode)
ON target.UserId = source.UserId AND target.IsPrimary = 1
WHEN MATCHED THEN
    UPDATE SET CardHolderName = source.CardHolderName,
               CardBrand = source.CardBrand,
               CardLast4 = source.CardLast4,
               ExpiryMonth = source.ExpiryMonth,
               ExpiryYear = source.ExpiryYear,
               BillingAddress = source.BillingAddress,
               BillingCity = source.BillingCity,
               BillingCountry = source.BillingCountry,
               BillingPostalCode = source.BillingPostalCode,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, CardHolderName, CardBrand, CardLast4, ExpiryMonth, ExpiryYear, BillingAddress, BillingCity, BillingCountry, BillingPostalCode, IsPrimary, CreatedAt)
    VALUES (NEWID(), source.UserId, source.CardHolderName, source.CardBrand, source.CardLast4, source.ExpiryMonth, source.ExpiryYear, source.BillingAddress, source.BillingCity, source.BillingCountry, source.BillingPostalCode, 1, @Now);
;

MERGE dbo.UserSupportTickets AS target
USING (VALUES
    (NEWID(), @BeautyCustomer1, @TenantBeauty, N'Spa randevu teyidi', N'Konaklama öncesi spa rezervasyon saatini onaylamak istiyor.', N'Yanıtlandı', N'E-posta', DATEADD(DAY, -5, @Now)),
    (NEWID(), @BeautyCustomer1, @TenantBeauty, N'Kurumsal fatura talebi', N'Son konaklama faturası şirket ünvanı ile gönderildi.', N'Çözüldü', N'Portal', DATEADD(DAY, -12, @Now)),
    (NEWID(), @BeautyCustomer2, @TenantBeauty, N'Paket yükseltme', N'Çift kişilik paket yerine deluxe paket tercih edilmek istendi.', N'Alındı', N'Telefon', DATEADD(DAY, -2, @Now))
) AS source(Id, UserId, TenantId, Subject, Summary, Status, Channel, CreatedAt)
ON target.Id = source.Id
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, TenantId, Subject, Summary, Status, Channel, CreatedAt)
    VALUES (source.Id, source.UserId, source.TenantId, source.Subject, source.Summary, source.Status, source.Channel, source.CreatedAt);
;

MERGE dbo.TenantParameters AS target
USING (VALUES
    ('auth', 'requireKvkk', 'true', 0),
    ('auth', 'kvkkText', N'KVKK metni örneği.', 0),
    ('auth', 'requireTwoFactor', 'false', 0),
    ('auth', 'twoFactorProvider', 'email', 0),
    ('shop', 'defaultShopId', CONVERT(NVARCHAR(50), @BeautySalon), 0),
    ('shop', 'defaultShopName', N'Güzellik Stüdyosu', 0),
    ('shop', 'defaultShopTimeZone', 'Europe/Istanbul', 0),
    ('logging', 'enableGeneral', 'true', 0),
    ('logging', 'enableAccounting', 'true', 0)
) AS source(Category, [Key], [Value], IsSecret)
ON target.TenantId = @TenantBeauty AND target.[Key] = source.[Key]
WHEN MATCHED THEN
    UPDATE SET Category = source.Category,
               [Value] = source.[Value],
               IsSecret = source.IsSecret,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, TenantId, Category, [Key], [Value], IsSecret, CreatedAt)
    VALUES (NEWID(), @TenantBeauty, source.Category, source.[Key], source.[Value], source.IsSecret, @Now);
;

/* -------------------------------------------------------------------------- */
/* Automotive Service Network                                                 */
/* -------------------------------------------------------------------------- */
DECLARE @TenantAuto UNIQUEIDENTIFIER;
SELECT @TenantAuto = Id FROM dbo.Tenants WHERE Domain = 'auto.agnostic.test';
IF @TenantAuto IS NULL
BEGIN
    SET @TenantAuto = NEWID();
    INSERT INTO dbo.Tenants (Id, Name, Domain, DefaultTheme, CreatedAt)
    VALUES (@TenantAuto, N'Automotive Service Network', 'auto.agnostic.test', 'auto-steel', @Now);
END;

DECLARE @AutoService UNIQUEIDENTIFIER;
SELECT @AutoService = Id FROM dbo.Resources WHERE TenantId = @TenantAuto AND Name = N'Premium Oto Servis';
IF @AutoService IS NULL
BEGIN
    SET @AutoService = NEWID();
    INSERT INTO dbo.Resources (Id, TenantId, Name, Capacity, CreatedAt)
    VALUES (@AutoService, @TenantAuto, N'Premium Oto Servis', 6, @Now);
END;

DECLARE @AutoTire UNIQUEIDENTIFIER;
SELECT @AutoTire = Id FROM dbo.Resources WHERE TenantId = @TenantAuto AND Name = N'Lastik Merkezi';
IF @AutoTire IS NULL
BEGIN
    SET @AutoTire = NEWID();
    INSERT INTO dbo.Resources (Id, TenantId, Name, Capacity, CreatedAt)
    VALUES (@AutoTire, @TenantAuto, N'Lastik Merkezi', 4, @Now);
END;

DECLARE @AutoAdmin UNIQUEIDENTIFIER;
SELECT @AutoAdmin = Id FROM dbo.Users WHERE Email = 'admin@auto.agnostic.test';
IF @AutoAdmin IS NULL
BEGIN
    SET @AutoAdmin = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@AutoAdmin, @TenantAuto, @RoleTenantAdmin, 'admin@auto.agnostic.test', 'ldQXbZpb9QOK3ED2vDH9cyDjPCdh5ZEPiCpUzZ74yOE=', N'Emre Aydın', 'auto-steel', 0, @Now);
END;

DECLARE @AutoShopAdmin UNIQUEIDENTIFIER;
SELECT @AutoShopAdmin = Id FROM dbo.Users WHERE Email = 'service@auto.agnostic.test';
IF @AutoShopAdmin IS NULL
BEGIN
    SET @AutoShopAdmin = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@AutoShopAdmin, @TenantAuto, @RoleShopAdmin, 'service@auto.agnostic.test', 'LGRCIPVd8VSPw5gyiq98rlSQT81P7f3t4g7ks3w0/Dg=', N'Murat Çelik', 'auto-steel', 0, @Now);
END;

DECLARE @AutoShopStaff UNIQUEIDENTIFIER;
SELECT @AutoShopStaff = Id FROM dbo.Users WHERE Email = 'usta@auto.agnostic.test';
IF @AutoShopStaff IS NULL
BEGIN
    SET @AutoShopStaff = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@AutoShopStaff, @TenantAuto, @RoleShopStaff, 'usta@auto.agnostic.test', 'Bd1KE3anLZpeD60yAA9+YWUaXO9cnJoMOBbHRD2vv28=', N'Tolga Kaplan', 'inherit', 0, @Now);
END;

DECLARE @AutoAccounting UNIQUEIDENTIFIER;
SELECT @AutoAccounting = Id FROM dbo.Users WHERE Email = 'finance@auto.agnostic.test';
IF @AutoAccounting IS NULL
BEGIN
    SET @AutoAccounting = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@AutoAccounting, @TenantAuto, @RoleAccounting, 'finance@auto.agnostic.test', 'nu6tHiXZdSEW16a7BkrYLvaNVOXyN1plxrvm2yyFqoo=', N'Selim Arslan', 'auto-steel', 0, @Now);
END;

DECLARE @AutoCustomer1 UNIQUEIDENTIFIER;
SELECT @AutoCustomer1 = Id FROM dbo.Users WHERE Email = 'omer.customer@auto.agnostic.test';
IF @AutoCustomer1 IS NULL
BEGIN
    SET @AutoCustomer1 = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@AutoCustomer1, @TenantAuto, @RoleCustomer, 'omer.customer@auto.agnostic.test', 'b5ryb2L3VovuHm+ElZRUeoz9+QRJb6sZze5xkqLCtTg=', N'Ömer Aksoy', 'inherit', 0, @Now);
END;

DECLARE @AutoCustomer2 UNIQUEIDENTIFIER;
SELECT @AutoCustomer2 = Id FROM dbo.Users WHERE Email = 'selin.customer@auto.agnostic.test';
IF @AutoCustomer2 IS NULL
BEGIN
    SET @AutoCustomer2 = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@AutoCustomer2, @TenantAuto, @RoleCustomer, 'selin.customer@auto.agnostic.test', 'b5ryb2L3VovuHm+ElZRUeoz9+QRJb6sZze5xkqLCtTg=', N'Selin Öztürk', 'inherit', 0, @Now);
END;

MERGE dbo.NotificationPreferences AS target
USING (VALUES
    (@AutoAdmin, 1, 1, 0),
    (@AutoShopAdmin, 1, 1, 1),
    (@AutoShopStaff, 1, 1, 0),
    (@AutoAccounting, 0, 1, 0),
    (@AutoCustomer1, 1, 1, 0),
    (@AutoCustomer2, 1, 1, 0)
) AS source(UserId, PushEnabled, EmailEnabled, SmsEnabled)
ON target.UserId = source.UserId
WHEN MATCHED THEN
    UPDATE SET PushEnabled = source.PushEnabled,
               EmailEnabled = source.EmailEnabled,
               SmsEnabled = source.SmsEnabled,
               PreferredChannel = @EmailChannel,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, PushEnabled, EmailEnabled, SmsEnabled, PreferredChannel, CreatedAt)
    VALUES (NEWID(), source.UserId, source.PushEnabled, source.EmailEnabled, source.SmsEnabled, @EmailChannel, @Now);
;

MERGE dbo.UserProfiles AS target
USING (VALUES
    (@AutoCustomer1, N'+90 534 222 33 44', N'Bağdat Caddesi No:120', NULL, N'İstanbul', N'Türkiye', N'34718'),
    (@AutoCustomer2, N'+90 535 444 55 66', N'Ankara Bulvarı No:45', N'Kat 3', N'Ankara', N'Türkiye', N'06520')
) AS source(UserId, PhoneNumber, AddressLine1, AddressLine2, City, Country, PostalCode)
ON target.UserId = source.UserId
WHEN MATCHED THEN
    UPDATE SET PhoneNumber = source.PhoneNumber,
               AddressLine1 = source.AddressLine1,
               AddressLine2 = source.AddressLine2,
               City = source.City,
               Country = source.Country,
               PostalCode = source.PostalCode,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, PhoneNumber, AddressLine1, AddressLine2, City, Country, PostalCode, CreatedAt)
    VALUES (NEWID(), source.UserId, source.PhoneNumber, source.AddressLine1, source.AddressLine2, source.City, source.Country, source.PostalCode, @Now);
;

MERGE dbo.UserPaymentMethods AS target
USING (VALUES
    (@AutoCustomer1, N'Ömer Aksoy', N'VISA', N'1111', N'09', N'28', N'Bağdat Caddesi No:120', N'İstanbul', N'Türkiye', N'34718'),
    (@AutoCustomer2, N'Selin Öztürk', N'Mastercard', N'7788', N'04', N'26', N'Ankara Bulvarı No:45 Kat 3', N'Ankara', N'Türkiye', N'06520')
) AS source(UserId, CardHolderName, CardBrand, CardLast4, ExpiryMonth, ExpiryYear, BillingAddress, BillingCity, BillingCountry, BillingPostalCode)
ON target.UserId = source.UserId AND target.IsPrimary = 1
WHEN MATCHED THEN
    UPDATE SET CardHolderName = source.CardHolderName,
               CardBrand = source.CardBrand,
               CardLast4 = source.CardLast4,
               ExpiryMonth = source.ExpiryMonth,
               ExpiryYear = source.ExpiryYear,
               BillingAddress = source.BillingAddress,
               BillingCity = source.BillingCity,
               BillingCountry = source.BillingCountry,
               BillingPostalCode = source.BillingPostalCode,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, CardHolderName, CardBrand, CardLast4, ExpiryMonth, ExpiryYear, BillingAddress, BillingCity, BillingCountry, BillingPostalCode, IsPrimary, CreatedAt)
    VALUES (NEWID(), source.UserId, source.CardHolderName, source.CardBrand, source.CardLast4, source.ExpiryMonth, source.ExpiryYear, source.BillingAddress, source.BillingCity, source.BillingCountry, source.BillingPostalCode, 1, @Now);
;

MERGE dbo.UserSupportTickets AS target
USING (VALUES
    (NEWID(), @AutoCustomer1, @TenantAuto, N'Lastik değişim randevusu', N'Yedek lastik stok bilgisi talep edildi.', N'Yanıtlandı', N'Telefon', DATEADD(DAY, -3, @Now)),
    (NEWID(), @AutoCustomer2, @TenantAuto, N'Mobil servis talebi', N'Ankara ofisine mobil ekip yönlendirme isteği alındı.', N'Alındı', N'Portal', DATEADD(DAY, -1, @Now))
) AS source(Id, UserId, TenantId, Subject, Summary, Status, Channel, CreatedAt)
ON target.Id = source.Id
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, TenantId, Subject, Summary, Status, Channel, CreatedAt)
    VALUES (source.Id, source.UserId, source.TenantId, source.Subject, source.Summary, source.Status, source.Channel, source.CreatedAt);
;

MERGE dbo.TenantParameters AS target
USING (VALUES
    ('auth', 'requireKvkk', 'true', 0),
    ('auth', 'kvkkText', N'KVKK metni örneği.', 0),
    ('auth', 'requireTwoFactor', 'false', 0),
    ('auth', 'twoFactorProvider', 'email', 0),
    ('shop', 'defaultShopId', CONVERT(NVARCHAR(50), @AutoService), 0),
    ('shop', 'defaultShopName', N'Premium Oto Servis', 0),
    ('shop', 'defaultShopTimeZone', 'Europe/Istanbul', 0),
    ('logging', 'enableGeneral', 'true', 0),
    ('logging', 'enableAccounting', 'true', 0)
) AS source(Category, [Key], [Value], IsSecret)
ON target.TenantId = @TenantAuto AND target.[Key] = source.[Key]
WHEN MATCHED THEN
    UPDATE SET Category = source.Category,
               [Value] = source.[Value],
               IsSecret = source.IsSecret,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, TenantId, Category, [Key], [Value], IsSecret, CreatedAt)
    VALUES (NEWID(), @TenantAuto, source.Category, source.[Key], source.[Value], source.IsSecret, @Now);
;

/* -------------------------------------------------------------------------- */
/* Health & Fitness Hub                                                       */
/* -------------------------------------------------------------------------- */
DECLARE @TenantFitness UNIQUEIDENTIFIER;
SELECT @TenantFitness = Id FROM dbo.Tenants WHERE Domain = 'fitness.agnostic.test';
IF @TenantFitness IS NULL
BEGIN
    SET @TenantFitness = NEWID();
    INSERT INTO dbo.Tenants (Id, Name, Domain, DefaultTheme, CreatedAt)
    VALUES (@TenantFitness, N'Health & Fitness Hub', 'fitness.agnostic.test', 'fitness-emerald', @Now);
END;

DECLARE @FitnessCrossfit UNIQUEIDENTIFIER;
SELECT @FitnessCrossfit = Id FROM dbo.Resources WHERE TenantId = @TenantFitness AND Name = N'Crossfit Arena';
IF @FitnessCrossfit IS NULL
BEGIN
    SET @FitnessCrossfit = NEWID();
    INSERT INTO dbo.Resources (Id, TenantId, Name, Capacity, CreatedAt)
    VALUES (@FitnessCrossfit, @TenantFitness, N'Crossfit Arena', 20, @Now);
END;

DECLARE @FitnessYoga UNIQUEIDENTIFIER;
SELECT @FitnessYoga = Id FROM dbo.Resources WHERE TenantId = @TenantFitness AND Name = N'Yoga Loft';
IF @FitnessYoga IS NULL
BEGIN
    SET @FitnessYoga = NEWID();
    INSERT INTO dbo.Resources (Id, TenantId, Name, Capacity, CreatedAt)
    VALUES (@FitnessYoga, @TenantFitness, N'Yoga Loft', 15, @Now);
END;

DECLARE @FitnessAdmin UNIQUEIDENTIFIER;
SELECT @FitnessAdmin = Id FROM dbo.Users WHERE Email = 'admin@fitness.agnostic.test';
IF @FitnessAdmin IS NULL
BEGIN
    SET @FitnessAdmin = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@FitnessAdmin, @TenantFitness, @RoleTenantAdmin, 'admin@fitness.agnostic.test', 'ldQXbZpb9QOK3ED2vDH9cyDjPCdh5ZEPiCpUzZ74yOE=', N'Damla Arı', 'fitness-emerald', 0, @Now);
END;

DECLARE @FitnessShopAdmin UNIQUEIDENTIFIER;
SELECT @FitnessShopAdmin = Id FROM dbo.Users WHERE Email = 'studio@fitness.agnostic.test';
IF @FitnessShopAdmin IS NULL
BEGIN
    SET @FitnessShopAdmin = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@FitnessShopAdmin, @TenantFitness, @RoleShopAdmin, 'studio@fitness.agnostic.test', 'LGRCIPVd8VSPw5gyiq98rlSQT81P7f3t4g7ks3w0/Dg=', N'Burak Şahin', 'fitness-emerald', 0, @Now);
END;

DECLARE @FitnessShopStaff UNIQUEIDENTIFIER;
SELECT @FitnessShopStaff = Id FROM dbo.Users WHERE Email = 'coach@fitness.agnostic.test';
IF @FitnessShopStaff IS NULL
BEGIN
    SET @FitnessShopStaff = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@FitnessShopStaff, @TenantFitness, @RoleShopStaff, 'coach@fitness.agnostic.test', 'Bd1KE3anLZpeD60yAA9+YWUaXO9cnJoMOBbHRD2vv28=', N'Nazım Koç', 'inherit', 0, @Now);
END;

DECLARE @FitnessAccounting UNIQUEIDENTIFIER;
SELECT @FitnessAccounting = Id FROM dbo.Users WHERE Email = 'finance@fitness.agnostic.test';
IF @FitnessAccounting IS NULL
BEGIN
    SET @FitnessAccounting = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@FitnessAccounting, @TenantFitness, @RoleAccounting, 'finance@fitness.agnostic.test', 'nu6tHiXZdSEW16a7BkrYLvaNVOXyN1plxrvm2yyFqoo=', N'Ece Yıldız', 'fitness-emerald', 0, @Now);
END;

DECLARE @FitnessCustomer1 UNIQUEIDENTIFIER;
SELECT @FitnessCustomer1 = Id FROM dbo.Users WHERE Email = 'zeynep.customer@fitness.agnostic.test';
IF @FitnessCustomer1 IS NULL
BEGIN
    SET @FitnessCustomer1 = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@FitnessCustomer1, @TenantFitness, @RoleCustomer, 'zeynep.customer@fitness.agnostic.test', 'b5ryb2L3VovuHm+ElZRUeoz9+QRJb6sZze5xkqLCtTg=', N'Zeynep Korkmaz', 'inherit', 0, @Now);
END;

DECLARE @FitnessCustomer2 UNIQUEIDENTIFIER;
SELECT @FitnessCustomer2 = Id FROM dbo.Users WHERE Email = 'berk.customer@fitness.agnostic.test';
IF @FitnessCustomer2 IS NULL
BEGIN
    SET @FitnessCustomer2 = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@FitnessCustomer2, @TenantFitness, @RoleCustomer, 'berk.customer@fitness.agnostic.test', 'b5ryb2L3VovuHm+ElZRUeoz9+QRJb6sZze5xkqLCtTg=', N'Berk Güneş', 'inherit', 0, @Now);
END;

MERGE dbo.NotificationPreferences AS target
USING (VALUES
    (@FitnessAdmin, 1, 1, 0),
    (@FitnessShopAdmin, 1, 1, 1),
    (@FitnessShopStaff, 1, 1, 0),
    (@FitnessAccounting, 0, 1, 0),
    (@FitnessCustomer1, 1, 1, 0),
    (@FitnessCustomer2, 1, 1, 0)
) AS source(UserId, PushEnabled, EmailEnabled, SmsEnabled)
ON target.UserId = source.UserId
WHEN MATCHED THEN
    UPDATE SET PushEnabled = source.PushEnabled,
               EmailEnabled = source.EmailEnabled,
               SmsEnabled = source.SmsEnabled,
               PreferredChannel = @EmailChannel,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, PushEnabled, EmailEnabled, SmsEnabled, PreferredChannel, CreatedAt)
    VALUES (NEWID(), source.UserId, source.PushEnabled, source.EmailEnabled, source.SmsEnabled, @EmailChannel, @Now);
;

MERGE dbo.UserProfiles AS target
USING (VALUES
    (@FitnessCustomer1, N'+90 536 123 45 67', N'Nişantaşı Spor Sokak No:9', NULL, N'İstanbul', N'Türkiye', N'34365'),
    (@FitnessCustomer2, N'+90 537 987 65 43', N'Caddebostan Sahil Yolu No:30', N'Daire 2', N'İstanbul', N'Türkiye', N'34728')
) AS source(UserId, PhoneNumber, AddressLine1, AddressLine2, City, Country, PostalCode)
ON target.UserId = source.UserId
WHEN MATCHED THEN
    UPDATE SET PhoneNumber = source.PhoneNumber,
               AddressLine1 = source.AddressLine1,
               AddressLine2 = source.AddressLine2,
               City = source.City,
               Country = source.Country,
               PostalCode = source.PostalCode,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, PhoneNumber, AddressLine1, AddressLine2, City, Country, PostalCode, CreatedAt)
    VALUES (NEWID(), source.UserId, source.PhoneNumber, source.AddressLine1, source.AddressLine2, source.City, source.Country, source.PostalCode, @Now);
;

MERGE dbo.UserPaymentMethods AS target
USING (VALUES
    (@FitnessCustomer1, N'Zeynep Korkmaz', N'VISA', N'9001', N'05', N'29', N'Nişantaşı Spor Sokak No:9', N'İstanbul', N'Türkiye', N'34365'),
    (@FitnessCustomer2, N'Berk Güneş', N'Mastercard', N'6620', N'12', N'26', N'Caddebostan Sahil Yolu No:30 Daire 2', N'İstanbul', N'Türkiye', N'34728')
) AS source(UserId, CardHolderName, CardBrand, CardLast4, ExpiryMonth, ExpiryYear, BillingAddress, BillingCity, BillingCountry, BillingPostalCode)
ON target.UserId = source.UserId AND target.IsPrimary = 1
WHEN MATCHED THEN
    UPDATE SET CardHolderName = source.CardHolderName,
               CardBrand = source.CardBrand,
               CardLast4 = source.CardLast4,
               ExpiryMonth = source.ExpiryMonth,
               ExpiryYear = source.ExpiryYear,
               BillingAddress = source.BillingAddress,
               BillingCity = source.BillingCity,
               BillingCountry = source.BillingCountry,
               BillingPostalCode = source.BillingPostalCode,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, CardHolderName, CardBrand, CardLast4, ExpiryMonth, ExpiryYear, BillingAddress, BillingCity, BillingCountry, BillingPostalCode, IsPrimary, CreatedAt)
    VALUES (NEWID(), source.UserId, source.CardHolderName, source.CardBrand, source.CardLast4, source.ExpiryMonth, source.ExpiryYear, source.BillingAddress, source.BillingCity, source.BillingCountry, source.BillingPostalCode, 1, @Now);
;

MERGE dbo.UserSupportTickets AS target
USING (VALUES
    (NEWID(), @FitnessCustomer1, @TenantFitness, N'Grup dersi kontenjanı', N'Spinning dersi kontenjanı artırılması talep edildi.', N'Çözüldü', N'Portal', DATEADD(DAY, -7, @Now)),
    (NEWID(), @FitnessCustomer2, @TenantFitness, N'Kişisel antrenör talebi', N'Yeni program için koç ataması istendi.', N'Yanıtlandı', N'E-posta', DATEADD(DAY, -4, @Now))
) AS source(Id, UserId, TenantId, Subject, Summary, Status, Channel, CreatedAt)
ON target.Id = source.Id
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, TenantId, Subject, Summary, Status, Channel, CreatedAt)
    VALUES (source.Id, source.UserId, source.TenantId, source.Subject, source.Summary, source.Status, source.Channel, source.CreatedAt);
;

MERGE dbo.TenantParameters AS target
USING (VALUES
    ('auth', 'requireKvkk', 'true', 0),
    ('auth', 'kvkkText', N'KVKK metni örneği.', 0),
    ('auth', 'requireTwoFactor', 'false', 0),
    ('auth', 'twoFactorProvider', 'email', 0),
    ('shop', 'defaultShopId', CONVERT(NVARCHAR(50), @FitnessCrossfit), 0),
    ('shop', 'defaultShopName', N'Crossfit Arena', 0),
    ('shop', 'defaultShopTimeZone', 'Europe/Istanbul', 0),
    ('logging', 'enableGeneral', 'true', 0),
    ('logging', 'enableAccounting', 'true', 0)
) AS source(Category, [Key], [Value], IsSecret)
ON target.TenantId = @TenantFitness AND target.[Key] = source.[Key]
WHEN MATCHED THEN
    UPDATE SET Category = source.Category,
               [Value] = source.[Value],
               IsSecret = source.IsSecret,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, TenantId, Category, [Key], [Value], IsSecret, CreatedAt)
    VALUES (NEWID(), @TenantFitness, source.Category, source.[Key], source.[Value], source.IsSecret, @Now);
;

/* -------------------------------------------------------------------------- */
/* Education & Tutoring Alliance                                             */
/* -------------------------------------------------------------------------- */
DECLARE @TenantEdu UNIQUEIDENTIFIER;
SELECT @TenantEdu = Id FROM dbo.Tenants WHERE Domain = 'edu.agnostic.test';
IF @TenantEdu IS NULL
BEGIN
    SET @TenantEdu = NEWID();
    INSERT INTO dbo.Tenants (Id, Name, Domain, DefaultTheme, CreatedAt)
    VALUES (@TenantEdu, N'Education & Tutoring Alliance', 'edu.agnostic.test', 'edu-indigo', @Now);
END;

DECLARE @EduStem UNIQUEIDENTIFIER;
SELECT @EduStem = Id FROM dbo.Resources WHERE TenantId = @TenantEdu AND Name = N'STEM Akademi';
IF @EduStem IS NULL
BEGIN
    SET @EduStem = NEWID();
    INSERT INTO dbo.Resources (Id, TenantId, Name, Capacity, CreatedAt)
    VALUES (@EduStem, @TenantEdu, N'STEM Akademi', 18, @Now);
END;

DECLARE @EduLanguage UNIQUEIDENTIFIER;
SELECT @EduLanguage = Id FROM dbo.Resources WHERE TenantId = @TenantEdu AND Name = N'Dil Atölyesi';
IF @EduLanguage IS NULL
BEGIN
    SET @EduLanguage = NEWID();
    INSERT INTO dbo.Resources (Id, TenantId, Name, Capacity, CreatedAt)
    VALUES (@EduLanguage, @TenantEdu, N'Dil Atölyesi', 10, @Now);
END;

DECLARE @EduAdmin UNIQUEIDENTIFIER;
SELECT @EduAdmin = Id FROM dbo.Users WHERE Email = 'admin@edu.agnostic.test';
IF @EduAdmin IS NULL
BEGIN
    SET @EduAdmin = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@EduAdmin, @TenantEdu, @RoleTenantAdmin, 'admin@edu.agnostic.test', 'ldQXbZpb9QOK3ED2vDH9cyDjPCdh5ZEPiCpUzZ74yOE=', N'Leyla Uçar', 'edu-indigo', 1, @Now);
END;

DECLARE @EduShopAdmin UNIQUEIDENTIFIER;
SELECT @EduShopAdmin = Id FROM dbo.Users WHERE Email = 'koord@edu.agnostic.test';
IF @EduShopAdmin IS NULL
BEGIN
    SET @EduShopAdmin = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@EduShopAdmin, @TenantEdu, @RoleShopAdmin, 'koord@edu.agnostic.test', 'LGRCIPVd8VSPw5gyiq98rlSQT81P7f3t4g7ks3w0/Dg=', N'Kerem Ünlü', 'edu-indigo', 0, @Now);
END;

DECLARE @EduShopStaff UNIQUEIDENTIFIER;
SELECT @EduShopStaff = Id FROM dbo.Users WHERE Email = 'ogretmen@edu.agnostic.test';
IF @EduShopStaff IS NULL
BEGIN
    SET @EduShopStaff = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@EduShopStaff, @TenantEdu, @RoleShopStaff, 'ogretmen@edu.agnostic.test', 'Bd1KE3anLZpeD60yAA9+YWUaXO9cnJoMOBbHRD2vv28=', N'Cem Arslan', 'inherit', 0, @Now);
END;

DECLARE @EduAccounting UNIQUEIDENTIFIER;
SELECT @EduAccounting = Id FROM dbo.Users WHERE Email = 'finance@edu.agnostic.test';
IF @EduAccounting IS NULL
BEGIN
    SET @EduAccounting = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@EduAccounting, @TenantEdu, @RoleAccounting, 'finance@edu.agnostic.test', 'nu6tHiXZdSEW16a7BkrYLvaNVOXyN1plxrvm2yyFqoo=', N'Figen Sezgin', 'edu-indigo', 0, @Now);
END;

DECLARE @EduCustomer1 UNIQUEIDENTIFIER;
SELECT @EduCustomer1 = Id FROM dbo.Users WHERE Email = 'veli1@edu.agnostic.test';
IF @EduCustomer1 IS NULL
BEGIN
    SET @EduCustomer1 = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@EduCustomer1, @TenantEdu, @RoleCustomer, 'veli1@edu.agnostic.test', 'b5ryb2L3VovuHm+ElZRUeoz9+QRJb6sZze5xkqLCtTg=', N'Veli Demir', 'inherit', 0, @Now);
END;

DECLARE @EduCustomer2 UNIQUEIDENTIFIER;
SELECT @EduCustomer2 = Id FROM dbo.Users WHERE Email = 'veli2@edu.agnostic.test';
IF @EduCustomer2 IS NULL
BEGIN
    SET @EduCustomer2 = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@EduCustomer2, @TenantEdu, @RoleCustomer, 'veli2@edu.agnostic.test', 'b5ryb2L3VovuHm+ElZRUeoz9+QRJb6sZze5xkqLCtTg=', N'Veli Çetin', 'inherit', 0, @Now);
END;

MERGE dbo.NotificationPreferences AS target
USING (VALUES
    (@EduAdmin, 1, 1, 0),
    (@EduShopAdmin, 1, 1, 1),
    (@EduShopStaff, 1, 1, 0),
    (@EduAccounting, 0, 1, 0),
    (@EduCustomer1, 1, 1, 0),
    (@EduCustomer2, 1, 1, 0)
) AS source(UserId, PushEnabled, EmailEnabled, SmsEnabled)
ON target.UserId = source.UserId
WHEN MATCHED THEN
    UPDATE SET PushEnabled = source.PushEnabled,
               EmailEnabled = source.EmailEnabled,
               SmsEnabled = source.SmsEnabled,
               PreferredChannel = @EmailChannel,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, PushEnabled, EmailEnabled, SmsEnabled, PreferredChannel, CreatedAt)
    VALUES (NEWID(), source.UserId, source.PushEnabled, source.EmailEnabled, source.SmsEnabled, @EmailChannel, @Now);
;

MERGE dbo.UserProfiles AS target
USING (VALUES
    (@EduCustomer1, N'+90 538 210 98 76', N'Kampüs Caddesi No:5', N'Daire 12', N'İzmir', N'Türkiye', N'35210'),
    (@EduCustomer2, N'+90 539 765 43 21', N'Atatürk Bulvarı No:88', NULL, N'Eskişehir', N'Türkiye', N'26010')
) AS source(UserId, PhoneNumber, AddressLine1, AddressLine2, City, Country, PostalCode)
ON target.UserId = source.UserId
WHEN MATCHED THEN
    UPDATE SET PhoneNumber = source.PhoneNumber,
               AddressLine1 = source.AddressLine1,
               AddressLine2 = source.AddressLine2,
               City = source.City,
               Country = source.Country,
               PostalCode = source.PostalCode,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, PhoneNumber, AddressLine1, AddressLine2, City, Country, PostalCode, CreatedAt)
    VALUES (NEWID(), source.UserId, source.PhoneNumber, source.AddressLine1, source.AddressLine2, source.City, source.Country, source.PostalCode, @Now);
;

MERGE dbo.UserPaymentMethods AS target
USING (VALUES
    (@EduCustomer1, N'Veli Demir', N'VISA', N'3434', N'03', N'29', N'Kampüs Caddesi No:5 Daire 12', N'İzmir', N'Türkiye', N'35210'),
    (@EduCustomer2, N'Veli Çetin', N'Mastercard', N'2211', N'10', N'27', N'Atatürk Bulvarı No:88', N'Eskişehir', N'Türkiye', N'26010')
) AS source(UserId, CardHolderName, CardBrand, CardLast4, ExpiryMonth, ExpiryYear, BillingAddress, BillingCity, BillingCountry, BillingPostalCode)
ON target.UserId = source.UserId AND target.IsPrimary = 1
WHEN MATCHED THEN
    UPDATE SET CardHolderName = source.CardHolderName,
               CardBrand = source.CardBrand,
               CardLast4 = source.CardLast4,
               ExpiryMonth = source.ExpiryMonth,
               ExpiryYear = source.ExpiryYear,
               BillingAddress = source.BillingAddress,
               BillingCity = source.BillingCity,
               BillingCountry = source.BillingCountry,
               BillingPostalCode = source.BillingPostalCode,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, CardHolderName, CardBrand, CardLast4, ExpiryMonth, ExpiryYear, BillingAddress, BillingCity, BillingCountry, BillingPostalCode, IsPrimary, CreatedAt)
    VALUES (NEWID(), source.UserId, source.CardHolderName, source.CardBrand, source.CardLast4, source.ExpiryMonth, source.ExpiryYear, source.BillingAddress, source.BillingCity, source.BillingCountry, source.BillingPostalCode, 1, @Now);
;

MERGE dbo.UserSupportTickets AS target
USING (VALUES
    (NEWID(), @EduCustomer1, @TenantEdu, N'Online ders kaydı', N'Yeni STEM sınıfı için kontenjan soruldu.', N'Yanıtlandı', N'Portal', DATEADD(DAY, -6, @Now)),
    (NEWID(), @EduCustomer2, @TenantEdu, N'Sertifika talebi', N'Tamamlanan eğitim için sertifika e-postası tekrar istendi.', N'Çözüldü', N'E-posta', DATEADD(DAY, -3, @Now))
) AS source(Id, UserId, TenantId, Subject, Summary, Status, Channel, CreatedAt)
ON target.Id = source.Id
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, TenantId, Subject, Summary, Status, Channel, CreatedAt)
    VALUES (source.Id, source.UserId, source.TenantId, source.Subject, source.Summary, source.Status, source.Channel, source.CreatedAt);
;

MERGE dbo.TenantParameters AS target
USING (VALUES
    ('auth', 'requireKvkk', 'true', 0),
    ('auth', 'kvkkText', N'KVKK metni örneği.', 0),
    ('auth', 'requireTwoFactor', 'false', 0),
    ('auth', 'twoFactorProvider', 'email', 0),
    ('shop', 'defaultShopId', CONVERT(NVARCHAR(50), @EduStem), 0),
    ('shop', 'defaultShopName', N'STEM Akademi', 0),
    ('shop', 'defaultShopTimeZone', 'Europe/Istanbul', 0),
    ('logging', 'enableGeneral', 'true', 0),
    ('logging', 'enableAccounting', 'true', 0)
) AS source(Category, [Key], [Value], IsSecret)
ON target.TenantId = @TenantEdu AND target.[Key] = source.[Key]
WHEN MATCHED THEN
    UPDATE SET Category = source.Category,
               [Value] = source.[Value],
               IsSecret = source.IsSecret,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, TenantId, Category, [Key], [Value], IsSecret, CreatedAt)
    VALUES (NEWID(), @TenantEdu, source.Category, source.[Key], source.[Value], source.IsSecret, @Now);
;

/* -------------------------------------------------------------------------- */
/* Pet Care Cooperative                                                       */
/* -------------------------------------------------------------------------- */
DECLARE @TenantPet UNIQUEIDENTIFIER;
SELECT @TenantPet = Id FROM dbo.Tenants WHERE Domain = 'pet.agnostic.test';
IF @TenantPet IS NULL
BEGIN
    SET @TenantPet = NEWID();
    INSERT INTO dbo.Tenants (Id, Name, Domain, DefaultTheme, CreatedAt)
    VALUES (@TenantPet, N'Pet Care Cooperative', 'pet.agnostic.test', 'pet-amber', @Now);
END;

DECLARE @PetVet UNIQUEIDENTIFIER;
SELECT @PetVet = Id FROM dbo.Resources WHERE TenantId = @TenantPet AND Name = N'Pati Veteriner Kliniği';
IF @PetVet IS NULL
BEGIN
    SET @PetVet = NEWID();
    INSERT INTO dbo.Resources (Id, TenantId, Name, Capacity, CreatedAt)
    VALUES (@PetVet, @TenantPet, N'Pati Veteriner Kliniği', 5, @Now);
END;

DECLARE @PetSpa UNIQUEIDENTIFIER;
SELECT @PetSpa = Id FROM dbo.Resources WHERE TenantId = @TenantPet AND Name = N'Evcil Spa';
IF @PetSpa IS NULL
BEGIN
    SET @PetSpa = NEWID();
    INSERT INTO dbo.Resources (Id, TenantId, Name, Capacity, CreatedAt)
    VALUES (@PetSpa, @TenantPet, N'Evcil Spa', 6, @Now);
END;

DECLARE @PetAdmin UNIQUEIDENTIFIER;
SELECT @PetAdmin = Id FROM dbo.Users WHERE Email = 'admin@pet.agnostic.test';
IF @PetAdmin IS NULL
BEGIN
    SET @PetAdmin = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@PetAdmin, @TenantPet, @RoleTenantAdmin, 'admin@pet.agnostic.test', 'ldQXbZpb9QOK3ED2vDH9cyDjPCdh5ZEPiCpUzZ74yOE=', N'Gizem Korkmaz', 'pet-amber', 1, @Now);
END;

DECLARE @PetShopAdmin UNIQUEIDENTIFIER;
SELECT @PetShopAdmin = Id FROM dbo.Users WHERE Email = 'koordinator@pet.agnostic.test';
IF @PetShopAdmin IS NULL
BEGIN
    SET @PetShopAdmin = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@PetShopAdmin, @TenantPet, @RoleShopAdmin, 'koordinator@pet.agnostic.test', 'LGRCIPVd8VSPw5gyiq98rlSQT81P7f3t4g7ks3w0/Dg=', N'Onur Taş', 'pet-amber', 0, @Now);
END;

DECLARE @PetShopStaff UNIQUEIDENTIFIER;
SELECT @PetShopStaff = Id FROM dbo.Users WHERE Email = 'groomer@pet.agnostic.test';
IF @PetShopStaff IS NULL
BEGIN
    SET @PetShopStaff = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@PetShopStaff, @TenantPet, @RoleShopStaff, 'groomer@pet.agnostic.test', 'Bd1KE3anLZpeD60yAA9+YWUaXO9cnJoMOBbHRD2vv28=', N'Derya Kaplan', 'inherit', 0, @Now);
END;

DECLARE @PetAccounting UNIQUEIDENTIFIER;
SELECT @PetAccounting = Id FROM dbo.Users WHERE Email = 'finance@pet.agnostic.test';
IF @PetAccounting IS NULL
BEGIN
    SET @PetAccounting = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@PetAccounting, @TenantPet, @RoleAccounting, 'finance@pet.agnostic.test', 'nu6tHiXZdSEW16a7BkrYLvaNVOXyN1plxrvm2yyFqoo=', N'Mehmet Erdem', 'pet-amber', 0, @Now);
END;

DECLARE @PetCustomer1 UNIQUEIDENTIFIER;
SELECT @PetCustomer1 = Id FROM dbo.Users WHERE Email = 'mert.customer@pet.agnostic.test';
IF @PetCustomer1 IS NULL
BEGIN
    SET @PetCustomer1 = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@PetCustomer1, @TenantPet, @RoleCustomer, 'mert.customer@pet.agnostic.test', 'b5ryb2L3VovuHm+ElZRUeoz9+QRJb6sZze5xkqLCtTg=', N'Mert Arı', 'inherit', 0, @Now);
END;

DECLARE @PetCustomer2 UNIQUEIDENTIFIER;
SELECT @PetCustomer2 = Id FROM dbo.Users WHERE Email = 'irem.customer@pet.agnostic.test';
IF @PetCustomer2 IS NULL
BEGIN
    SET @PetCustomer2 = NEWID();
    INSERT INTO dbo.Users (Id, TenantId, RoleId, Email, PasswordHash, FullName, PreferredTheme, MultiFactorEnabled, CreatedAt)
    VALUES (@PetCustomer2, @TenantPet, @RoleCustomer, 'irem.customer@pet.agnostic.test', 'b5ryb2L3VovuHm+ElZRUeoz9+QRJb6sZze5xkqLCtTg=', N'İrem Sönmez', 'inherit', 0, @Now);
END;

MERGE dbo.NotificationPreferences AS target
USING (VALUES
    (@PetAdmin, 1, 1, 0),
    (@PetShopAdmin, 1, 1, 1),
    (@PetShopStaff, 1, 1, 0),
    (@PetAccounting, 0, 1, 0),
    (@PetCustomer1, 1, 1, 0),
    (@PetCustomer2, 1, 1, 0)
) AS source(UserId, PushEnabled, EmailEnabled, SmsEnabled)
ON target.UserId = source.UserId
WHEN MATCHED THEN
    UPDATE SET PushEnabled = source.PushEnabled,
               EmailEnabled = source.EmailEnabled,
               SmsEnabled = source.SmsEnabled,
               PreferredChannel = @EmailChannel,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, PushEnabled, EmailEnabled, SmsEnabled, PreferredChannel, CreatedAt)
    VALUES (NEWID(), source.UserId, source.PushEnabled, source.EmailEnabled, source.SmsEnabled, @EmailChannel, @Now);
;

MERGE dbo.UserProfiles AS target
USING (VALUES
    (@PetCustomer1, N'+90 540 111 22 11', N'Erenköy Veteriner Sokak No:3', NULL, N'İstanbul', N'Türkiye', N'34742'),
    (@PetCustomer2, N'+90 541 333 44 55', N'Alsancak Sahil Sokak No:19', N'Daire 5', N'İzmir', N'Türkiye', N'35220')
) AS source(UserId, PhoneNumber, AddressLine1, AddressLine2, City, Country, PostalCode)
ON target.UserId = source.UserId
WHEN MATCHED THEN
    UPDATE SET PhoneNumber = source.PhoneNumber,
               AddressLine1 = source.AddressLine1,
               AddressLine2 = source.AddressLine2,
               City = source.City,
               Country = source.Country,
               PostalCode = source.PostalCode,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, PhoneNumber, AddressLine1, AddressLine2, City, Country, PostalCode, CreatedAt)
    VALUES (NEWID(), source.UserId, source.PhoneNumber, source.AddressLine1, source.AddressLine2, source.City, source.Country, source.PostalCode, @Now);
;

MERGE dbo.UserPaymentMethods AS target
USING (VALUES
    (@PetCustomer1, N'Mert Arı', N'VISA', N'7007', N'02', N'29', N'Erenköy Veteriner Sokak No:3', N'İstanbul', N'Türkiye', N'34742'),
    (@PetCustomer2, N'İrem Sönmez', N'Mastercard', N'8899', N'07', N'27', N'Alsancak Sahil Sokak No:19 Daire 5', N'İzmir', N'Türkiye', N'35220')
) AS source(UserId, CardHolderName, CardBrand, CardLast4, ExpiryMonth, ExpiryYear, BillingAddress, BillingCity, BillingCountry, BillingPostalCode)
ON target.UserId = source.UserId AND target.IsPrimary = 1
WHEN MATCHED THEN
    UPDATE SET CardHolderName = source.CardHolderName,
               CardBrand = source.CardBrand,
               CardLast4 = source.CardLast4,
               ExpiryMonth = source.ExpiryMonth,
               ExpiryYear = source.ExpiryYear,
               BillingAddress = source.BillingAddress,
               BillingCity = source.BillingCity,
               BillingCountry = source.BillingCountry,
               BillingPostalCode = source.BillingPostalCode,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, CardHolderName, CardBrand, CardLast4, ExpiryMonth, ExpiryYear, BillingAddress, BillingCity, BillingCountry, BillingPostalCode, IsPrimary, CreatedAt)
    VALUES (NEWID(), source.UserId, source.CardHolderName, source.CardBrand, source.CardLast4, source.ExpiryMonth, source.ExpiryYear, source.BillingAddress, source.BillingCity, source.BillingCountry, source.BillingPostalCode, 1, @Now);
;

MERGE dbo.UserSupportTickets AS target
USING (VALUES
    (NEWID(), @PetCustomer1, @TenantPet, N'Evcil hayvan transferi', N'Ankara çıkışlı uçuş için transfer desteği talep edildi.', N'Yanıtlandı', N'E-posta', DATEADD(DAY, -8, @Now)),
    (NEWID(), @PetCustomer2, @TenantPet, N'Ödeme planı sorusu', N'Yıllık bakım paketi için taksit bilgisi istendi.', N'Alındı', N'Portal', DATEADD(DAY, -2, @Now))
) AS source(Id, UserId, TenantId, Subject, Summary, Status, Channel, CreatedAt)
ON target.Id = source.Id
WHEN NOT MATCHED THEN
    INSERT (Id, UserId, TenantId, Subject, Summary, Status, Channel, CreatedAt)
    VALUES (source.Id, source.UserId, source.TenantId, source.Subject, source.Summary, source.Status, source.Channel, source.CreatedAt);
;

MERGE dbo.TenantParameters AS target
USING (VALUES
    ('auth', 'requireKvkk', 'true', 0),
    ('auth', 'kvkkText', N'KVKK metni örneği.', 0),
    ('auth', 'requireTwoFactor', 'false', 0),
    ('auth', 'twoFactorProvider', 'email', 0),
    ('shop', 'defaultShopId', CONVERT(NVARCHAR(50), @PetVet), 0),
    ('shop', 'defaultShopName', N'Pati Veteriner Kliniği', 0),
    ('shop', 'defaultShopTimeZone', 'Europe/Istanbul', 0),
    ('logging', 'enableGeneral', 'true', 0),
    ('logging', 'enableAccounting', 'true', 0)
) AS source(Category, [Key], [Value], IsSecret)
ON target.TenantId = @TenantPet AND target.[Key] = source.[Key]
WHEN MATCHED THEN
    UPDATE SET Category = source.Category,
               [Value] = source.[Value],
               IsSecret = source.IsSecret,
               UpdatedAt = @Now
WHEN NOT MATCHED THEN
    INSERT (Id, TenantId, Category, [Key], [Value], IsSecret, CreatedAt)
    VALUES (NEWID(), @TenantPet, source.Category, source.[Key], source.[Value], source.IsSecret, @Now);
;

/* -------------------------------------------------------------------------- */
/* Dil tercihleri                                                             */
/* -------------------------------------------------------------------------- */
UPDATE dbo.Users
SET PreferredLanguage = 'tr-TR'
WHERE Email LIKE 'admin@%.agnostic.test';

UPDATE dbo.Users
SET PreferredLanguage = 'en-US'
WHERE Email LIKE 'studio@%.agnostic.test'
   OR Email LIKE 'service@%.agnostic.test'
   OR Email LIKE 'koord@%.agnostic.test'
   OR Email LIKE 'finance@%.agnostic.test';

UPDATE dbo.Users
SET PreferredLanguage = 'en-GB'
WHERE Email LIKE 'coach@%.agnostic.test'
   OR Email LIKE 'groomer@%.agnostic.test';

UPDATE dbo.Users
SET PreferredLanguage = 'de-DE'
WHERE Email LIKE 'usta@auto.%' OR Email LIKE 'selin.customer@auto.%';

GO

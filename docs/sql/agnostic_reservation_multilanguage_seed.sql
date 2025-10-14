USE AgnosticReservation;
GO

SET NOCOUNT ON;

DECLARE @Now DATETIME2(7) = SYSUTCDATETIME();

DECLARE @TenantDomains TABLE (Domain NVARCHAR(200));
INSERT INTO @TenantDomains (Domain)
VALUES
    ('beauty.agnostic.test'),
    ('auto.agnostic.test'),
    ('fitness.agnostic.test'),
    ('edu.agnostic.test'),
    ('pet.agnostic.test');

DECLARE @LocalizationKeys TABLE ([Key] NVARCHAR(200), Description NVARCHAR(500));
INSERT INTO @LocalizationKeys ([Key], Description)
VALUES
    ('app.header.title', N'Uygulama başlık metni'),
    ('app.header.subtitle', N'Uygulama alt başlık metni'),
    ('localization.admin.title', N'Çoklu dil ekranı başlığı'),
    ('localization.admin.description', N'Çoklu dil ekranı açıklaması'),
    ('localization.admin.addButton', N'Çeviri ekle butonu'),
    ('localization.admin.keyLabel', N'Anahtar alan etiketi'),
    ('localization.admin.languageLabel', N'Dil alan etiketi'),
    ('localization.admin.valueLabel', N'Metin alan etiketi'),
    ('localization.admin.infoLabel', N'Açıklama alanı etiketi'),
    ('localization.admin.descriptionPlaceholder', N'Açıklama alanı ipucu'),
    ('localization.admin.tableDescription', N'Tablo açıklama başlığı'),
    ('localization.admin.emptyState', N'Kayıt bulunamadı mesajı'),
    ('localization.admin.toastSaved', N'Çeviri kaydetme bildirimi'),
    ('localization.admin.toastCleared', N'Önbellek temizleme bildirimi'),
    ('localization.admin.searchPlaceholder', N'Arama alanı ipucu'),
    ('localization.admin.validation', N'Zorunlu alan uyarısı'),
    ('localization.admin.loading', N'Yüklenme metni');

DECLARE @Translations TABLE ([Key] NVARCHAR(200), Language NVARCHAR(10), [Value] NVARCHAR(1024));
INSERT INTO @Translations ([Key], Language, [Value])
VALUES
    ('app.header.title', 'tr-TR', N'Agnostic Rezervasyon Paneli'),
    ('app.header.title', 'en-US', N'Agnostic Reservation Console'),
    ('app.header.title', 'en-GB', N'Agnostic Reservation Console'),
    ('app.header.title', 'de-DE', N'Agnostic Reservierungs-Konsole'),
    ('app.header.subtitle', 'tr-TR', N'Tenant bazlı yönetim ve çeviri kontrolü'),
    ('app.header.subtitle', 'en-US', N'Tenant-specific management and localization control'),
    ('app.header.subtitle', 'en-GB', N'Tenant-specific management and localisation control'),
    ('app.header.subtitle', 'de-DE', N'Mandantenspezifische Verwaltung und Übersetzungssteuerung'),
    ('localization.admin.title', 'tr-TR', N'Çoklu Dil Yönetimi'),
    ('localization.admin.title', 'en-US', N'Multi-language Management'),
    ('localization.admin.title', 'en-GB', N'Multi-language Management'),
    ('localization.admin.title', 'de-DE', N'Mehrsprachenverwaltung'),
    ('localization.admin.description', 'tr-TR', N'Anahtar bazında farklı diller için metinleri buradan güncelleyebilirsiniz.'),
    ('localization.admin.description', 'en-US', N'Update every language variant for a key from this screen.'),
    ('localization.admin.description', 'en-GB', N'Update every language variant for a key from this screen.'),
    ('localization.admin.description', 'de-DE', N'Aktualisieren Sie hier die Texte pro Sprache und Schlüssel.'),
    ('localization.admin.addButton', 'tr-TR', N'Yeni çeviri ekle'),
    ('localization.admin.addButton', 'en-US', N'Add translation'),
    ('localization.admin.addButton', 'en-GB', N'Add translation'),
    ('localization.admin.addButton', 'de-DE', N'Übersetzung hinzufügen'),
    ('localization.admin.keyLabel', 'tr-TR', N'Anahtar'),
    ('localization.admin.keyLabel', 'en-US', N'Key'),
    ('localization.admin.keyLabel', 'en-GB', N'Key'),
    ('localization.admin.keyLabel', 'de-DE', N'Schlüssel'),
    ('localization.admin.languageLabel', 'tr-TR', N'Dil'),
    ('localization.admin.languageLabel', 'en-US', N'Language'),
    ('localization.admin.languageLabel', 'en-GB', N'Language'),
    ('localization.admin.languageLabel', 'de-DE', N'Sprache'),
    ('localization.admin.valueLabel', 'tr-TR', N'Metin'),
    ('localization.admin.valueLabel', 'en-US', N'Text'),
    ('localization.admin.valueLabel', 'en-GB', N'Text'),
    ('localization.admin.valueLabel', 'de-DE', N'Text'),
    ('localization.admin.infoLabel', 'tr-TR', N'Bilgi'),
    ('localization.admin.infoLabel', 'en-US', N'Details'),
    ('localization.admin.infoLabel', 'en-GB', N'Details'),
    ('localization.admin.infoLabel', 'de-DE', N'Hinweis'),
    ('localization.admin.descriptionPlaceholder', 'tr-TR', N'İsteğe bağlı açıklama'),
    ('localization.admin.descriptionPlaceholder', 'en-US', N'Optional description'),
    ('localization.admin.descriptionPlaceholder', 'en-GB', N'Optional description'),
    ('localization.admin.descriptionPlaceholder', 'de-DE', N'Optionale Beschreibung'),
    ('localization.admin.tableDescription', 'tr-TR', N'Açıklama'),
    ('localization.admin.tableDescription', 'en-US', N'Description'),
    ('localization.admin.tableDescription', 'en-GB', N'Description'),
    ('localization.admin.tableDescription', 'de-DE', N'Beschreibung'),
    ('localization.admin.emptyState', 'tr-TR', N'Henüz tanımlanmış bir çeviri bulunmuyor.'),
    ('localization.admin.emptyState', 'en-US', N'No translations defined yet.'),
    ('localization.admin.emptyState', 'en-GB', N'No translations defined yet.'),
    ('localization.admin.emptyState', 'de-DE', N'Noch keine Übersetzungen vorhanden.'),
    ('localization.admin.toastSaved', 'tr-TR', N'Çeviri kaydedildi.'),
    ('localization.admin.toastSaved', 'en-US', N'Translation saved.'),
    ('localization.admin.toastSaved', 'en-GB', N'Translation saved.'),
    ('localization.admin.toastSaved', 'de-DE', N'Übersetzung gespeichert.'),
    ('localization.admin.toastCleared', 'tr-TR', N'Çeviri önbelleği temizlendi.'),
    ('localization.admin.toastCleared', 'en-US', N'Localization cache cleared.'),
    ('localization.admin.toastCleared', 'en-GB', N'Localization cache cleared.'),
    ('localization.admin.toastCleared', 'de-DE', N'Übersetzungs-Cache geleert.'),
    ('localization.admin.searchPlaceholder', 'tr-TR', N'Anahtar ara...'),
    ('localization.admin.searchPlaceholder', 'en-US', N'Search key...'),
    ('localization.admin.searchPlaceholder', 'en-GB', N'Search key...'),
    ('localization.admin.searchPlaceholder', 'de-DE', N'Schlüssel suchen...'),
    ('localization.admin.validation', 'tr-TR', N'Anahtar, dil ve metin alanları zorunludur.'),
    ('localization.admin.validation', 'en-US', N'Key, language and text fields are required.'),
    ('localization.admin.validation', 'en-GB', N'Key, language and text fields are required.'),
    ('localization.admin.validation', 'de-DE', N'Schlüssel, Sprache und Text sind Pflichtfelder.'),
    ('localization.admin.loading', 'tr-TR', N'Yükleniyor...'),
    ('localization.admin.loading', 'en-US', N'Loading...'),
    ('localization.admin.loading', 'en-GB', N'Loading...'),
    ('localization.admin.loading', 'de-DE', N'Wird geladen...');

DECLARE @LocalizationSeed TABLE (TenantDomain NVARCHAR(200), [Key] NVARCHAR(200), Description NVARCHAR(500), Language NVARCHAR(10), [Value] NVARCHAR(1024));
INSERT INTO @LocalizationSeed (TenantDomain, [Key], Description, Language, [Value])
SELECT d.Domain, k.[Key], k.Description, t.Language, t.[Value]
FROM @TenantDomains d
JOIN @LocalizationKeys k ON 1 = 1
JOIN @Translations t ON t.[Key] = k.[Key];

DECLARE @Seed TABLE (TenantId UNIQUEIDENTIFIER, [Key] NVARCHAR(200), Description NVARCHAR(500), Language NVARCHAR(10), [Value] NVARCHAR(1024));
INSERT INTO @Seed (TenantId, [Key], Description, Language, [Value])
SELECT tn.Id, s.[Key], s.Description, s.Language, s.[Value]
FROM @LocalizationSeed s
JOIN dbo.Tenants tn ON tn.Domain = s.TenantDomain;

IF EXISTS (SELECT 1 FROM @Seed)
BEGIN
    ;WITH DistinctKeys AS (
        SELECT DISTINCT TenantId, [Key], Description
        FROM @Seed
    )
    MERGE dbo.LocalizationKeys AS target
    USING DistinctKeys AS source
        ON target.TenantId = source.TenantId AND target.[Key] = source.[Key]
    WHEN MATCHED THEN
        UPDATE SET Description = source.Description, UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (Id, TenantId, [Key], Description, CreatedAt)
        VALUES (NEWID(), source.TenantId, source.[Key], source.Description, @Now);

    ;WITH SourceTexts AS (
        SELECT s.TenantId, s.[Key], s.Language, s.[Value], k.Id AS LocalizationKeyId
        FROM @Seed s
        JOIN dbo.LocalizationKeys k ON k.TenantId = s.TenantId AND k.[Key] = s.[Key]
    )
    MERGE dbo.LocalizationTexts AS target
    USING SourceTexts AS source
        ON target.LocalizationKeyId = source.LocalizationKeyId AND target.Language = source.Language
    WHEN MATCHED THEN
        UPDATE SET [Value] = source.[Value], UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (Id, LocalizationKeyId, Language, [Value], CreatedAt)
        VALUES (NEWID(), source.LocalizationKeyId, source.Language, source.[Value], @Now);
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF DB_ID(N'AgnosticReservation') IS NULL
BEGIN
    PRINT N'Creating database AgnosticReservation';
    EXEC ('CREATE DATABASE AgnosticReservation');
END
GO

USE AgnosticReservation;
GO

PRINT N'Creating tables...';
GO

IF OBJECT_ID(N'dbo.Tenants', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tenants
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Tenants PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Domain NVARCHAR(200) NULL,
        DefaultTheme NVARCHAR(50) NOT NULL CONSTRAINT DF_Tenants_DefaultTheme DEFAULT(N'light'),
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Tenants_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    CREATE UNIQUE INDEX IX_Tenants_Name ON dbo.Tenants(Name);
END
GO

IF OBJECT_ID(N'dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
        Name NVARCHAR(150) NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Roles_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    CREATE UNIQUE INDEX IX_Roles_Name ON dbo.Roles(Name);
END
GO

IF OBJECT_ID(N'dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        RoleId UNIQUEIDENTIFIER NOT NULL,
        Email NVARCHAR(256) NOT NULL,
        PasswordHash NVARCHAR(256) NOT NULL,
        PreferredTheme NVARCHAR(50) NOT NULL CONSTRAINT DF_Users_PreferredTheme DEFAULT(N'inherit'),
        MultiFactorEnabled BIT NOT NULL CONSTRAINT DF_Users_Mfa DEFAULT(0),
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.Users ADD CONSTRAINT FK_Users_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id);
    ALTER TABLE dbo.Users ADD CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id);
    CREATE UNIQUE INDEX IX_Users_Email ON dbo.Users(Email);
    CREATE INDEX IX_Users_TenantId ON dbo.Users(TenantId);
END
GO

IF OBJECT_ID(N'dbo.RolePermissions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RolePermissions
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RolePermissions PRIMARY KEY,
        RoleId UNIQUEIDENTIFIER NOT NULL,
        Permission INT NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_RolePermissions_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.RolePermissions ADD CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IX_RolePermissions_Role_Permission ON dbo.RolePermissions(RoleId, Permission);
END
GO

IF OBJECT_ID(N'dbo.NotificationPreferences', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.NotificationPreferences
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_NotificationPreferences PRIMARY KEY,
        UserId UNIQUEIDENTIFIER NOT NULL,
        PushEnabled BIT NOT NULL,
        EmailEnabled BIT NOT NULL,
        SmsEnabled BIT NOT NULL,
        PreferredChannel INT NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_NotificationPreferences_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.NotificationPreferences ADD CONSTRAINT FK_NotificationPreferences_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IX_NotificationPreferences_UserId ON dbo.NotificationPreferences(UserId);
END
GO

IF OBJECT_ID(N'dbo.TenantParameters', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantParameters
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_TenantParameters PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        Category NVARCHAR(100) NOT NULL,
        [Key] NVARCHAR(100) NOT NULL,
        [Value] NVARCHAR(4000) NOT NULL,
        IsSecret BIT NOT NULL CONSTRAINT DF_TenantParameters_IsSecret DEFAULT(0),
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_TenantParameters_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.TenantParameters ADD CONSTRAINT FK_TenantParameters_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IX_TenantParameters_Tenant_Category_Key ON dbo.TenantParameters(TenantId, Category, [Key]);
END
GO

IF OBJECT_ID(N'dbo.Resources', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Resources
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Resources PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Capacity INT NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Resources_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.Resources ADD CONSTRAINT FK_Resources_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IX_Resources_Tenant_Name ON dbo.Resources(TenantId, Name);
END
GO

IF OBJECT_ID(N'dbo.Reservations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Reservations
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Reservations PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        ResourceId UNIQUEIDENTIFIER NOT NULL,
        UserId UNIQUEIDENTIFIER NOT NULL,
        StartUtc DATETIME2(7) NOT NULL,
        EndUtc DATETIME2(7) NOT NULL,
        Status INT NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Reservations_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.Reservations ADD CONSTRAINT FK_Reservations_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    ALTER TABLE dbo.Reservations ADD CONSTRAINT FK_Reservations_Resources FOREIGN KEY (ResourceId) REFERENCES dbo.Resources(Id);
    ALTER TABLE dbo.Reservations ADD CONSTRAINT FK_Reservations_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id);
    CREATE INDEX IX_Reservations_TenantId ON dbo.Reservations(TenantId);
    CREATE INDEX IX_Reservations_Resource_Start_End ON dbo.Reservations(ResourceId, StartUtc, EndUtc);
END
GO

IF OBJECT_ID(N'dbo.Documents', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Documents
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Documents PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        FileName NVARCHAR(255) NOT NULL,
        ContentType NVARCHAR(200) NOT NULL,
        Size BIGINT NOT NULL,
        StoragePath NVARCHAR(500) NOT NULL,
        IsPrivate BIT NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Documents_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.Documents ADD CONSTRAINT FK_Documents_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    CREATE INDEX IX_Documents_TenantId ON dbo.Documents(TenantId);
END
GO

IF OBJECT_ID(N'dbo.DashboardDefinitions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DashboardDefinitions
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_DashboardDefinitions PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        RoleId UNIQUEIDENTIFIER NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_DashboardDefinitions_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.DashboardDefinitions ADD CONSTRAINT FK_DashboardDefinitions_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    ALTER TABLE dbo.DashboardDefinitions ADD CONSTRAINT FK_DashboardDefinitions_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id);
    CREATE UNIQUE INDEX IX_DashboardDefinitions_Tenant_Role ON dbo.DashboardDefinitions(TenantId, RoleId);
END
GO

IF OBJECT_ID(N'dbo.DashboardWidgets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DashboardWidgets
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_DashboardWidgets PRIMARY KEY,
        DashboardDefinitionId UNIQUEIDENTIFIER NOT NULL,
        WidgetType INT NOT NULL,
        [Order] INT NOT NULL,
        ConfigJson NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_DashboardWidgets_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.DashboardWidgets ADD CONSTRAINT FK_DashboardWidgets_DashboardDefinitions FOREIGN KEY (DashboardDefinitionId) REFERENCES dbo.DashboardDefinitions(Id) ON DELETE CASCADE;
    CREATE INDEX IX_DashboardWidgets_Definition_Order ON dbo.DashboardWidgets(DashboardDefinitionId, [Order]);
END
GO

IF OBJECT_ID(N'dbo.StockItems', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.StockItems
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_StockItems PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        Sku NVARCHAR(100) NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Quantity INT NOT NULL,
        ReorderLevel INT NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_StockItems_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.StockItems ADD CONSTRAINT FK_StockItems_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IX_StockItems_Tenant_Sku ON dbo.StockItems(TenantId, Sku);
END
GO

IF OBJECT_ID(N'dbo.PaymentTransactions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PaymentTransactions
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PaymentTransactions PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        ReservationId UNIQUEIDENTIFIER NOT NULL,
        Amount DECIMAL(18, 2) NOT NULL,
        Currency NVARCHAR(10) NOT NULL,
        Provider NVARCHAR(100) NOT NULL,
        Status NVARCHAR(30) NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_PaymentTransactions_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.PaymentTransactions ADD CONSTRAINT FK_PaymentTransactions_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    ALTER TABLE dbo.PaymentTransactions ADD CONSTRAINT FK_PaymentTransactions_Reservations FOREIGN KEY (ReservationId) REFERENCES dbo.Reservations(Id) ON DELETE CASCADE;
    CREATE INDEX IX_PaymentTransactions_ReservationId ON dbo.PaymentTransactions(ReservationId);
END
GO

IF OBJECT_ID(N'dbo.PurchaseOrders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PurchaseOrders
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PurchaseOrders PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        Supplier NVARCHAR(200) NOT NULL,
        TotalAmount DECIMAL(18, 2) NOT NULL,
        ExpectedDate DATETIME2(7) NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_PurchaseOrders_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.PurchaseOrders ADD CONSTRAINT FK_PurchaseOrders_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    CREATE INDEX IX_PurchaseOrders_TenantId ON dbo.PurchaseOrders(TenantId);
END
GO

IF OBJECT_ID(N'dbo.PurchaseOrderLines', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PurchaseOrderLines
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PurchaseOrderLines PRIMARY KEY,
        PurchaseOrderId UNIQUEIDENTIFIER NOT NULL,
        Sku NVARCHAR(100) NOT NULL,
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(18, 2) NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_PurchaseOrderLines_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.PurchaseOrderLines ADD CONSTRAINT FK_PurchaseOrderLines_PurchaseOrders FOREIGN KEY (PurchaseOrderId) REFERENCES dbo.PurchaseOrders(Id) ON DELETE CASCADE;
    CREATE INDEX IX_PurchaseOrderLines_PurchaseOrderId ON dbo.PurchaseOrderLines(PurchaseOrderId);
END
GO

IF OBJECT_ID(N'dbo.ServicePackages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ServicePackages
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ServicePackages PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(2000) NOT NULL,
        Price DECIMAL(18, 2) NOT NULL,
        DurationMinutes INT NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_ServicePackages_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.ServicePackages ADD CONSTRAINT FK_ServicePackages_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IX_ServicePackages_Tenant_Name ON dbo.ServicePackages(TenantId, Name);
END
GO

IF OBJECT_ID(N'dbo.Invoices', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Invoices
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Invoices PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        ReservationId UNIQUEIDENTIFIER NOT NULL,
        TotalAmount DECIMAL(18, 2) NOT NULL,
        InvoiceDate DATETIME2(7) NOT NULL,
        Status NVARCHAR(30) NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Invoices_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.Invoices ADD CONSTRAINT FK_Invoices_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    ALTER TABLE dbo.Invoices ADD CONSTRAINT FK_Invoices_Reservations FOREIGN KEY (ReservationId) REFERENCES dbo.Reservations(Id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IX_Invoices_ReservationId ON dbo.Invoices(ReservationId);
END
GO

PRINT N'MSSQL schema ready.';
GO

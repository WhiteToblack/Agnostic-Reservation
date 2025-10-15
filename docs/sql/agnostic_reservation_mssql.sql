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

IF OBJECT_ID(N'dbo.EnsureColumn', 'P') IS NOT NULL
    DROP PROCEDURE dbo.EnsureColumn;
GO

CREATE PROCEDURE dbo.EnsureColumn
    @SchemaName NVARCHAR(128),
    @TableName NVARCHAR(128),
    @ColumnName NVARCHAR(128),
    @ColumnDefinition NVARCHAR(MAX),
    @DefaultConstraintName NVARCHAR(128) = NULL,
    @DefaultValue NVARCHAR(MAX) = NULL,
    @WithValues BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @FullTableName NVARCHAR(300) = QUOTENAME(@SchemaName) + N'.' + QUOTENAME(@TableName);
    DECLARE @TableObjectId INT = OBJECT_ID(@SchemaName + N'.' + @TableName);

    IF @TableObjectId IS NULL
    BEGIN
        RAISERROR(N'Table %s.%s does not exist.', 16, 1, @SchemaName, @TableName);
        RETURN;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = @TableObjectId
          AND name = @ColumnName
    )
    BEGIN
        DECLARE @AddSql NVARCHAR(MAX) = N'ALTER TABLE ' + @FullTableName + N' ADD ' + QUOTENAME(@ColumnName) + N' ' + @ColumnDefinition;

        IF @DefaultConstraintName IS NOT NULL AND @DefaultValue IS NOT NULL
        BEGIN
            SET @AddSql = @AddSql + N' CONSTRAINT ' + QUOTENAME(@DefaultConstraintName) + N' DEFAULT (' + @DefaultValue + N')';

            IF @WithValues = 1
            BEGIN
                SET @AddSql = @AddSql + N' WITH VALUES';
            END
        END

        EXEC sp_executesql @AddSql;
    END
    ELSE
    BEGIN
        DECLARE @ExistingConstraint NVARCHAR(128);

        IF @DefaultConstraintName IS NOT NULL AND @DefaultValue IS NOT NULL
        BEGIN
            SELECT @ExistingConstraint = dc.name
            FROM sys.default_constraints dc
                INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
            WHERE dc.parent_object_id = @TableObjectId
              AND c.name = @ColumnName;

            IF @ExistingConstraint IS NOT NULL
            BEGIN
                EXEC sp_executesql(
                    N'ALTER TABLE ' + @FullTableName + N' DROP CONSTRAINT ' + QUOTENAME(@ExistingConstraint) + N';'
                );
            END
        END

        DECLARE @AlterSql NVARCHAR(MAX) = N'ALTER TABLE ' + @FullTableName + N' ALTER COLUMN ' + QUOTENAME(@ColumnName) + N' ' + @ColumnDefinition + N';';
        EXEC sp_executesql @AlterSql;

        IF @DefaultConstraintName IS NOT NULL AND @DefaultValue IS NOT NULL
        BEGIN
            DECLARE @DefaultSql NVARCHAR(MAX) =
                N'ALTER TABLE ' + @FullTableName +
                N' ADD CONSTRAINT ' + QUOTENAME(@DefaultConstraintName) +
                N' DEFAULT (' + @DefaultValue + N') FOR ' + QUOTENAME(@ColumnName) + N';';
            EXEC sp_executesql @DefaultSql;
        END
    END
END
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Tenants', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Tenants', @ColumnName = N'Name', @ColumnDefinition = N'NVARCHAR(200) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Tenants', @ColumnName = N'Domain', @ColumnDefinition = N'NVARCHAR(200) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Tenants', @ColumnName = N'DefaultTheme', @ColumnDefinition = N'NVARCHAR(50) NOT NULL', @DefaultConstraintName = N'DF_Tenants_DefaultTheme', @DefaultValue = N'N''light''', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Tenants', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_Tenants_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Tenants', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Tenants', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Tenants', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
END
GO

IF OBJECT_ID(N'dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
        Name NVARCHAR(150) NOT NULL,
        HierarchyLevel INT NOT NULL CONSTRAINT DF_Roles_HierarchyLevel DEFAULT(0),
        IsSuperAdmin BIT NOT NULL CONSTRAINT DF_Roles_IsSuperAdmin DEFAULT(0),
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_Roles_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    CREATE UNIQUE INDEX IX_Roles_Name ON dbo.Roles(Name);
END
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Roles', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Roles', @ColumnName = N'Name', @ColumnDefinition = N'NVARCHAR(150) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Roles', @ColumnName = N'HierarchyLevel', @ColumnDefinition = N'INT NOT NULL', @DefaultConstraintName = N'DF_Roles_HierarchyLevel', @DefaultValue = N'0', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Roles', @ColumnName = N'IsSuperAdmin', @ColumnDefinition = N'BIT NOT NULL', @DefaultConstraintName = N'DF_Roles_IsSuperAdmin', @DefaultValue = N'0', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Roles', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_Roles_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Roles', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Roles', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Roles', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
        FullName NVARCHAR(200) NOT NULL,
        PasswordHash NVARCHAR(256) NOT NULL,
        PreferredTheme NVARCHAR(50) NOT NULL CONSTRAINT DF_Users_PreferredTheme DEFAULT(N'inherit'),
        PreferredLanguage NVARCHAR(10) NOT NULL CONSTRAINT DF_Users_PreferredLanguage DEFAULT(N'tr-TR'),
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'RoleId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'Email', @ColumnDefinition = N'NVARCHAR(256) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'FullName', @ColumnDefinition = N'NVARCHAR(200) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'PasswordHash', @ColumnDefinition = N'NVARCHAR(256) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'PreferredTheme', @ColumnDefinition = N'NVARCHAR(50) NOT NULL', @DefaultConstraintName = N'DF_Users_PreferredTheme', @DefaultValue = N'N''inherit''', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'PreferredLanguage', @ColumnDefinition = N'NVARCHAR(10) NOT NULL', @DefaultConstraintName = N'DF_Users_PreferredLanguage', @DefaultValue = N'N''tr-TR''', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'MultiFactorEnabled', @ColumnDefinition = N'BIT NOT NULL', @DefaultConstraintName = N'DF_Users_Mfa', @DefaultValue = N'0', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_Users_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Users', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'RolePermissions', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'RolePermissions', @ColumnName = N'RoleId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'RolePermissions', @ColumnName = N'Permission', @ColumnDefinition = N'INT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'RolePermissions', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_RolePermissions_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'RolePermissions', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'RolePermissions', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'RolePermissions', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'NotificationPreferences', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'NotificationPreferences', @ColumnName = N'UserId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'NotificationPreferences', @ColumnName = N'PushEnabled', @ColumnDefinition = N'BIT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'NotificationPreferences', @ColumnName = N'EmailEnabled', @ColumnDefinition = N'BIT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'NotificationPreferences', @ColumnName = N'SmsEnabled', @ColumnDefinition = N'BIT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'NotificationPreferences', @ColumnName = N'PreferredChannel', @ColumnDefinition = N'INT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'NotificationPreferences', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_NotificationPreferences_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'NotificationPreferences', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'NotificationPreferences', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'NotificationPreferences', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
END
GO

IF OBJECT_ID(N'dbo.UserProfiles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserProfiles
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_UserProfiles PRIMARY KEY,
        UserId UNIQUEIDENTIFIER NOT NULL,
        PhoneNumber NVARCHAR(32) NULL,
        AddressLine1 NVARCHAR(250) NULL,
        AddressLine2 NVARCHAR(250) NULL,
        City NVARCHAR(120) NULL,
        Country NVARCHAR(120) NULL,
        PostalCode NVARCHAR(20) NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_UserProfiles_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL
    );
    ALTER TABLE dbo.UserProfiles ADD CONSTRAINT FK_UserProfiles_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IX_UserProfiles_UserId ON dbo.UserProfiles(UserId);
END
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserProfiles', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserProfiles', @ColumnName = N'UserId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserProfiles', @ColumnName = N'PhoneNumber', @ColumnDefinition = N'NVARCHAR(32) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserProfiles', @ColumnName = N'AddressLine1', @ColumnDefinition = N'NVARCHAR(250) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserProfiles', @ColumnName = N'AddressLine2', @ColumnDefinition = N'NVARCHAR(250) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserProfiles', @ColumnName = N'City', @ColumnDefinition = N'NVARCHAR(120) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserProfiles', @ColumnName = N'Country', @ColumnDefinition = N'NVARCHAR(120) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserProfiles', @ColumnName = N'PostalCode', @ColumnDefinition = N'NVARCHAR(20) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserProfiles', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_UserProfiles_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserProfiles', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
END
GO

IF OBJECT_ID(N'dbo.UserPaymentMethods', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserPaymentMethods
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_UserPaymentMethods PRIMARY KEY,
        UserId UNIQUEIDENTIFIER NOT NULL,
        CardHolderName NVARCHAR(200) NULL,
        CardBrand NVARCHAR(50) NULL,
        CardLast4 NVARCHAR(4) NULL,
        ExpiryMonth NVARCHAR(2) NULL,
        ExpiryYear NVARCHAR(4) NULL,
        BillingAddress NVARCHAR(250) NULL,
        BillingCity NVARCHAR(120) NULL,
        BillingCountry NVARCHAR(120) NULL,
        BillingPostalCode NVARCHAR(20) NULL,
        IsPrimary BIT NOT NULL CONSTRAINT DF_UserPaymentMethods_IsPrimary DEFAULT(1),
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_UserPaymentMethods_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL
    );
    ALTER TABLE dbo.UserPaymentMethods ADD CONSTRAINT FK_UserPaymentMethods_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE;
    CREATE INDEX IX_UserPaymentMethods_UserId ON dbo.UserPaymentMethods(UserId);
END
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'UserId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'CardHolderName', @ColumnDefinition = N'NVARCHAR(200) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'CardBrand', @ColumnDefinition = N'NVARCHAR(50) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'CardLast4', @ColumnDefinition = N'NVARCHAR(4) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'ExpiryMonth', @ColumnDefinition = N'NVARCHAR(2) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'ExpiryYear', @ColumnDefinition = N'NVARCHAR(4) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'BillingAddress', @ColumnDefinition = N'NVARCHAR(250) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'BillingCity', @ColumnDefinition = N'NVARCHAR(120) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'BillingCountry', @ColumnDefinition = N'NVARCHAR(120) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'BillingPostalCode', @ColumnDefinition = N'NVARCHAR(20) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'IsPrimary', @ColumnDefinition = N'BIT NOT NULL', @DefaultConstraintName = N'DF_UserPaymentMethods_IsPrimary', @DefaultValue = N'1', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_UserPaymentMethods_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserPaymentMethods', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
END
GO

IF OBJECT_ID(N'dbo.UserSupportTickets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserSupportTickets
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_UserSupportTickets PRIMARY KEY,
        UserId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        Subject NVARCHAR(200) NOT NULL,
        Summary NVARCHAR(1000) NULL,
        Status NVARCHAR(40) NOT NULL,
        Channel NVARCHAR(40) NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_UserSupportTickets_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL
    );
    ALTER TABLE dbo.UserSupportTickets ADD CONSTRAINT FK_UserSupportTickets_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE;
    ALTER TABLE dbo.UserSupportTickets ADD CONSTRAINT FK_UserSupportTickets_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    CREATE INDEX IX_UserSupportTickets_User ON dbo.UserSupportTickets(UserId, CreatedAt DESC);
END
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserSupportTickets', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserSupportTickets', @ColumnName = N'UserId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserSupportTickets', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserSupportTickets', @ColumnName = N'Subject', @ColumnDefinition = N'NVARCHAR(200) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserSupportTickets', @ColumnName = N'Summary', @ColumnDefinition = N'NVARCHAR(1000) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserSupportTickets', @ColumnName = N'Status', @ColumnDefinition = N'NVARCHAR(40) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserSupportTickets', @ColumnName = N'Channel', @ColumnDefinition = N'NVARCHAR(40) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserSupportTickets', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_UserSupportTickets_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'UserSupportTickets', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'TenantParameters', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'TenantParameters', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'TenantParameters', @ColumnName = N'Category', @ColumnDefinition = N'NVARCHAR(100) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'TenantParameters', @ColumnName = N'Key', @ColumnDefinition = N'NVARCHAR(100) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'TenantParameters', @ColumnName = N'Value', @ColumnDefinition = N'NVARCHAR(4000) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'TenantParameters', @ColumnName = N'IsSecret', @ColumnDefinition = N'BIT NOT NULL', @DefaultConstraintName = N'DF_TenantParameters_IsSecret', @DefaultValue = N'0', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'TenantParameters', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_TenantParameters_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'TenantParameters', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'TenantParameters', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'TenantParameters', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
END
GO

IF OBJECT_ID(N'dbo.LocalizationKeys', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LocalizationKeys
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_LocalizationKeys PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        [Key] NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_LocalizationKeys_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.LocalizationKeys ADD CONSTRAINT FK_LocalizationKeys_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IX_LocalizationKeys_Tenant_Key ON dbo.LocalizationKeys(TenantId, [Key]);
END
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationKeys', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationKeys', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationKeys', @ColumnName = N'Key', @ColumnDefinition = N'NVARCHAR(200) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationKeys', @ColumnName = N'Description', @ColumnDefinition = N'NVARCHAR(500) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationKeys', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_LocalizationKeys_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationKeys', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationKeys', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationKeys', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
END
GO

IF OBJECT_ID(N'dbo.LocalizationTexts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LocalizationTexts
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_LocalizationTexts PRIMARY KEY,
        LocalizationKeyId UNIQUEIDENTIFIER NOT NULL,
        Language NVARCHAR(10) NOT NULL,
        [Value] NVARCHAR(1024) NOT NULL,
        CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_LocalizationTexts_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(7) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL
    );
    ALTER TABLE dbo.LocalizationTexts ADD CONSTRAINT FK_LocalizationTexts_Keys FOREIGN KEY (LocalizationKeyId) REFERENCES dbo.LocalizationKeys(Id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IX_LocalizationTexts_Key_Language ON dbo.LocalizationTexts(LocalizationKeyId, Language);
END
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationTexts', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationTexts', @ColumnName = N'LocalizationKeyId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationTexts', @ColumnName = N'Language', @ColumnDefinition = N'NVARCHAR(10) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationTexts', @ColumnName = N'Value', @ColumnDefinition = N'NVARCHAR(1024) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationTexts', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_LocalizationTexts_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationTexts', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationTexts', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'LocalizationTexts', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Resources', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Resources', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Resources', @ColumnName = N'Name', @ColumnDefinition = N'NVARCHAR(200) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Resources', @ColumnName = N'Capacity', @ColumnDefinition = N'INT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Resources', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_Resources_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Resources', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Resources', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Resources', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Reservations', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Reservations', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Reservations', @ColumnName = N'ResourceId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Reservations', @ColumnName = N'UserId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Reservations', @ColumnName = N'StartUtc', @ColumnDefinition = N'DATETIME2(7) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Reservations', @ColumnName = N'EndUtc', @ColumnDefinition = N'DATETIME2(7) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Reservations', @ColumnName = N'Status', @ColumnDefinition = N'INT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Reservations', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_Reservations_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Reservations', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Reservations', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Reservations', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Documents', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Documents', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Documents', @ColumnName = N'FileName', @ColumnDefinition = N'NVARCHAR(255) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Documents', @ColumnName = N'ContentType', @ColumnDefinition = N'NVARCHAR(200) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Documents', @ColumnName = N'Size', @ColumnDefinition = N'BIGINT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Documents', @ColumnName = N'StoragePath', @ColumnDefinition = N'NVARCHAR(500) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Documents', @ColumnName = N'IsPrivate', @ColumnDefinition = N'BIT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Documents', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_Documents_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Documents', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Documents', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Documents', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardDefinitions', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardDefinitions', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardDefinitions', @ColumnName = N'RoleId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardDefinitions', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_DashboardDefinitions_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardDefinitions', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardDefinitions', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardDefinitions', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardWidgets', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardWidgets', @ColumnName = N'DashboardDefinitionId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardWidgets', @ColumnName = N'WidgetType', @ColumnDefinition = N'INT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardWidgets', @ColumnName = N'Order', @ColumnDefinition = N'INT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardWidgets', @ColumnName = N'ConfigJson', @ColumnDefinition = N'NVARCHAR(MAX) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardWidgets', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_DashboardWidgets_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardWidgets', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardWidgets', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'DashboardWidgets', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'StockItems', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'StockItems', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'StockItems', @ColumnName = N'Sku', @ColumnDefinition = N'NVARCHAR(100) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'StockItems', @ColumnName = N'Name', @ColumnDefinition = N'NVARCHAR(200) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'StockItems', @ColumnName = N'Quantity', @ColumnDefinition = N'INT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'StockItems', @ColumnName = N'ReorderLevel', @ColumnDefinition = N'INT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'StockItems', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_StockItems_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'StockItems', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'StockItems', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'StockItems', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
    ALTER TABLE dbo.PaymentTransactions ADD CONSTRAINT FK_PaymentTransactions_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id);
    ALTER TABLE dbo.PaymentTransactions ADD CONSTRAINT FK_PaymentTransactions_Reservations FOREIGN KEY (ReservationId) REFERENCES dbo.Reservations(Id) ON DELETE CASCADE;
    CREATE INDEX IX_PaymentTransactions_ReservationId ON dbo.PaymentTransactions(ReservationId);
END
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PaymentTransactions', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PaymentTransactions', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PaymentTransactions', @ColumnName = N'ReservationId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PaymentTransactions', @ColumnName = N'Amount', @ColumnDefinition = N'DECIMAL(18, 2) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PaymentTransactions', @ColumnName = N'Currency', @ColumnDefinition = N'NVARCHAR(10) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PaymentTransactions', @ColumnName = N'Provider', @ColumnDefinition = N'NVARCHAR(100) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PaymentTransactions', @ColumnName = N'Status', @ColumnDefinition = N'NVARCHAR(30) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PaymentTransactions', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_PaymentTransactions_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PaymentTransactions', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PaymentTransactions', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PaymentTransactions', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrders', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrders', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrders', @ColumnName = N'Supplier', @ColumnDefinition = N'NVARCHAR(200) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrders', @ColumnName = N'TotalAmount', @ColumnDefinition = N'DECIMAL(18, 2) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrders', @ColumnName = N'ExpectedDate', @ColumnDefinition = N'DATETIME2(7) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrders', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_PurchaseOrders_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrders', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrders', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrders', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrderLines', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrderLines', @ColumnName = N'PurchaseOrderId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrderLines', @ColumnName = N'Sku', @ColumnDefinition = N'NVARCHAR(100) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrderLines', @ColumnName = N'Quantity', @ColumnDefinition = N'INT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrderLines', @ColumnName = N'UnitPrice', @ColumnDefinition = N'DECIMAL(18, 2) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrderLines', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_PurchaseOrderLines_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrderLines', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrderLines', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'PurchaseOrderLines', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'ServicePackages', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'ServicePackages', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'ServicePackages', @ColumnName = N'Name', @ColumnDefinition = N'NVARCHAR(200) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'ServicePackages', @ColumnName = N'Description', @ColumnDefinition = N'NVARCHAR(2000) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'ServicePackages', @ColumnName = N'Price', @ColumnDefinition = N'DECIMAL(18, 2) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'ServicePackages', @ColumnName = N'DurationMinutes', @ColumnDefinition = N'INT NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'ServicePackages', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_ServicePackages_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'ServicePackages', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'ServicePackages', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'ServicePackages', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
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
    ALTER TABLE dbo.Invoices ADD CONSTRAINT FK_Invoices_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id);
    ALTER TABLE dbo.Invoices ADD CONSTRAINT FK_Invoices_Reservations FOREIGN KEY (ReservationId) REFERENCES dbo.Reservations(Id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IX_Invoices_ReservationId ON dbo.Invoices(ReservationId);
END
ELSE
BEGIN
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Invoices', @ColumnName = N'Id', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Invoices', @ColumnName = N'TenantId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Invoices', @ColumnName = N'ReservationId', @ColumnDefinition = N'UNIQUEIDENTIFIER NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Invoices', @ColumnName = N'TotalAmount', @ColumnDefinition = N'DECIMAL(18, 2) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Invoices', @ColumnName = N'InvoiceDate', @ColumnDefinition = N'DATETIME2(7) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Invoices', @ColumnName = N'Status', @ColumnDefinition = N'NVARCHAR(30) NOT NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Invoices', @ColumnName = N'CreatedAt', @ColumnDefinition = N'DATETIME2(7) NOT NULL', @DefaultConstraintName = N'DF_Invoices_CreatedAt', @DefaultValue = N'SYSUTCDATETIME()', @WithValues = 1;
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Invoices', @ColumnName = N'UpdatedAt', @ColumnDefinition = N'DATETIME2(7) NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Invoices', @ColumnName = N'CreatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
    EXEC dbo.EnsureColumn @SchemaName = N'dbo', @TableName = N'Invoices', @ColumnName = N'UpdatedBy', @ColumnDefinition = N'UNIQUEIDENTIFIER NULL';
END
GO

PRINT N'Seeding default roles and permissions...';
GO

IF OBJECT_ID(N'dbo.Roles', 'U') IS NOT NULL AND OBJECT_ID(N'dbo.RolePermissions', 'U') IS NOT NULL
BEGIN
    DECLARE @Now DATETIME2(7) = SYSUTCDATETIME();

    DECLARE @RoleSuperUser UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Name = 'SuperUser');
    IF @RoleSuperUser IS NULL
    BEGIN
        SET @RoleSuperUser = NEWID();
        INSERT INTO dbo.Roles (Id, Name, HierarchyLevel, IsSuperAdmin, CreatedAt)
        VALUES (@RoleSuperUser, 'SuperUser', 100, 1, @Now);
    END
    ELSE
    BEGIN
        UPDATE dbo.Roles SET HierarchyLevel = 100, IsSuperAdmin = 1 WHERE Id = @RoleSuperUser;
    END

    DECLARE @RoleTenantAdmin UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Name = 'TenantAdmin');
    IF @RoleTenantAdmin IS NULL
    BEGIN
        SET @RoleTenantAdmin = NEWID();
        INSERT INTO dbo.Roles (Id, Name, HierarchyLevel, IsSuperAdmin, CreatedAt)
        VALUES (@RoleTenantAdmin, 'TenantAdmin', 80, 0, @Now);
    END
    ELSE
    BEGIN
        UPDATE dbo.Roles SET HierarchyLevel = 80, IsSuperAdmin = 0 WHERE Id = @RoleTenantAdmin;
    END

    DECLARE @RoleShopAdmin UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Name = 'ShopAdmin');
    IF @RoleShopAdmin IS NULL
    BEGIN
        SET @RoleShopAdmin = NEWID();
        INSERT INTO dbo.Roles (Id, Name, HierarchyLevel, IsSuperAdmin, CreatedAt)
        VALUES (@RoleShopAdmin, 'ShopAdmin', 60, 0, @Now);
    END
    ELSE
    BEGIN
        UPDATE dbo.Roles SET HierarchyLevel = 60, IsSuperAdmin = 0 WHERE Id = @RoleShopAdmin;
    END

    DECLARE @RoleShopStaff UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Name = 'ShopStaff');
    IF @RoleShopStaff IS NULL
    BEGIN
        SET @RoleShopStaff = NEWID();
        INSERT INTO dbo.Roles (Id, Name, HierarchyLevel, IsSuperAdmin, CreatedAt)
        VALUES (@RoleShopStaff, 'ShopStaff', 40, 0, @Now);
    END
    ELSE
    BEGIN
        UPDATE dbo.Roles SET HierarchyLevel = 40, IsSuperAdmin = 0 WHERE Id = @RoleShopStaff;
    END

    DECLARE @RoleAccounting UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Name = 'Accounting');
    IF @RoleAccounting IS NULL
    BEGIN
        SET @RoleAccounting = NEWID();
        INSERT INTO dbo.Roles (Id, Name, HierarchyLevel, IsSuperAdmin, CreatedAt)
        VALUES (@RoleAccounting, 'Accounting', 50, 0, @Now);
    END
    ELSE
    BEGIN
        UPDATE dbo.Roles SET HierarchyLevel = 50, IsSuperAdmin = 0 WHERE Id = @RoleAccounting;
    END

    DECLARE @RoleCustomer UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Name = 'Customer');
    IF @RoleCustomer IS NULL
    BEGIN
        SET @RoleCustomer = NEWID();
        INSERT INTO dbo.Roles (Id, Name, HierarchyLevel, IsSuperAdmin, CreatedAt)
        VALUES (@RoleCustomer, 'Customer', 10, 0, @Now);
    END
    ELSE
    BEGIN
        UPDATE dbo.Roles SET HierarchyLevel = 10, IsSuperAdmin = 0 WHERE Id = @RoleCustomer;
    END

    -- SuperUser permissions
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleSuperUser AND Permission = 1)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleSuperUser, 1, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleSuperUser AND Permission = 2)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleSuperUser, 2, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleSuperUser AND Permission = 4)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleSuperUser, 4, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleSuperUser AND Permission = 8)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleSuperUser, 8, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleSuperUser AND Permission = 16)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleSuperUser, 16, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleSuperUser AND Permission = 32)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleSuperUser, 32, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleSuperUser AND Permission = 64)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleSuperUser, 64, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleSuperUser AND Permission = 128)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleSuperUser, 128, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleSuperUser AND Permission = 256)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleSuperUser, 256, @Now);

    -- TenantAdmin permissions
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleTenantAdmin AND Permission = 1)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleTenantAdmin, 1, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleTenantAdmin AND Permission = 2)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleTenantAdmin, 2, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleTenantAdmin AND Permission = 8)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleTenantAdmin, 8, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleTenantAdmin AND Permission = 16)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleTenantAdmin, 16, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleTenantAdmin AND Permission = 32)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleTenantAdmin, 32, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleTenantAdmin AND Permission = 64)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleTenantAdmin, 64, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleTenantAdmin AND Permission = 128)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleTenantAdmin, 128, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleTenantAdmin AND Permission = 256)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleTenantAdmin, 256, @Now);

    -- ShopAdmin permissions
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleShopAdmin AND Permission = 1)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleShopAdmin, 1, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleShopAdmin AND Permission = 2)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleShopAdmin, 2, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleShopAdmin AND Permission = 16)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleShopAdmin, 16, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleShopAdmin AND Permission = 128)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleShopAdmin, 128, @Now);

    -- ShopStaff permissions
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleShopStaff AND Permission = 1)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleShopStaff, 1, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleShopStaff AND Permission = 2)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleShopStaff, 2, @Now);

    -- Accounting permissions
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleAccounting AND Permission = 1)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleAccounting, 1, @Now);
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleAccounting AND Permission = 256)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleAccounting, 256, @Now);

    -- Customer permissions
    IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId = @RoleCustomer AND Permission = 1)
        INSERT INTO dbo.RolePermissions (Id, RoleId, Permission, CreatedAt) VALUES (NEWID(), @RoleCustomer, 1, @Now);
END
ELSE
BEGIN
    PRINT N'Skipping role seed because required tables are missing.';
END
GO

IF OBJECT_ID(N'dbo.EnsureColumn', 'P') IS NOT NULL
    DROP PROCEDURE dbo.EnsureColumn;
GO

PRINT N'MSSQL schema ready.';
GO

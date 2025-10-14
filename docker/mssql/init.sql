IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'AgnosticReservation')
BEGIN
    CREATE DATABASE [AgnosticReservation];
END
GO

USE [AgnosticReservation];
GO

IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'wtb')
BEGIN
    CREATE LOGIN [wtb] WITH PASSWORD = N'Asd123*', CHECK_POLICY = OFF, CHECK_EXPIRATION = OFF;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'wtb')
BEGIN
    CREATE USER [wtb] FOR LOGIN [wtb] WITH DEFAULT_SCHEMA = [dbo];
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_role_members drm
        INNER JOIN sys.database_principals dpRole ON drm.role_principal_id = dpRole.principal_id
        INNER JOIN sys.database_principals dpMember ON drm.member_principal_id = dpMember.principal_id
    WHERE dpRole.name = N'db_owner' AND dpMember.name = N'wtb'
)
BEGIN
    ALTER ROLE [db_owner] ADD MEMBER [wtb];
END
GO

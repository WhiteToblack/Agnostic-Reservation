using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Admin;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AgnosticReservation.Infrastructure.Persistence.Initialization;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(AppDbContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        await context.Database.MigrateAsync(cancellationToken);

        var roles = await EnsureRolesAsync(context, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var (defaultTenant, defaultResource) = await EnsureDefaultTenantAsync(context, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        await EnsureDefaultParametersAsync(context, defaultTenant, defaultResource, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        await EnsureAdminUsersAsync(context, defaultTenant, roles, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    private static async Task<Dictionary<string, Role>> EnsureRolesAsync(AppDbContext context, CancellationToken cancellationToken)
    {
        var roleMap = new Dictionary<string, Role>(StringComparer.OrdinalIgnoreCase);

        roleMap["SuperUser"] = await EnsureRoleAsync(
            context,
            "SuperUser",
            new[]
            {
                Permission.ViewDashboard,
                Permission.ManageReservations,
                Permission.ManageTenants,
                Permission.ManageParameters,
                Permission.ManageDocuments,
                Permission.ManageUsers,
                Permission.ManageNotifications,
                Permission.ManageInventory,
                Permission.ManageBilling
            },
            hierarchyLevel: 100,
            isSuperAdmin: true,
            cancellationToken);

        roleMap["TenantAdmin"] = await EnsureRoleAsync(
            context,
            "TenantAdmin",
            new[]
            {
                Permission.ViewDashboard,
                Permission.ManageReservations,
                Permission.ManageParameters,
                Permission.ManageDocuments,
                Permission.ManageUsers,
                Permission.ManageNotifications,
                Permission.ManageInventory,
                Permission.ManageBilling
            },
            hierarchyLevel: 80,
            isSuperAdmin: false,
            cancellationToken);

        roleMap["ShopAdmin"] = await EnsureRoleAsync(
            context,
            "ShopAdmin",
            new[]
            {
                Permission.ViewDashboard,
                Permission.ManageReservations,
                Permission.ManageDocuments,
                Permission.ManageInventory
            },
            hierarchyLevel: 60,
            isSuperAdmin: false,
            cancellationToken);

        roleMap["ShopStaff"] = await EnsureRoleAsync(
            context,
            "ShopStaff",
            new[]
            {
                Permission.ViewDashboard,
                Permission.ManageReservations
            },
            hierarchyLevel: 40,
            isSuperAdmin: false,
            cancellationToken);

        roleMap["Accounting"] = await EnsureRoleAsync(
            context,
            "Accounting",
            new[]
            {
                Permission.ViewDashboard,
                Permission.ManageBilling
            },
            hierarchyLevel: 50,
            isSuperAdmin: false,
            cancellationToken);

        roleMap["Customer"] = await EnsureRoleAsync(
            context,
            "Customer",
            new[]
            {
                Permission.ViewDashboard
            },
            hierarchyLevel: 10,
            isSuperAdmin: false,
            cancellationToken);

        return roleMap;
    }

    private static async Task<Role> EnsureRoleAsync(
        AppDbContext context,
        string roleName,
        IEnumerable<Permission> permissions,
        int hierarchyLevel,
        bool isSuperAdmin,
        CancellationToken cancellationToken)
    {
        var role = await context.Roles
            .Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Name == roleName, cancellationToken);

        if (role is null)
        {
            role = new Role(roleName, permissions, hierarchyLevel, isSuperAdmin);
            context.Roles.Add(role);
            return role;
        }

        role.UpdateHierarchy(hierarchyLevel, isSuperAdmin);

        var existingPermissions = role.Permissions.Select(p => p.Permission).ToHashSet();
        foreach (var permission in permissions)
        {
            if (!existingPermissions.Contains(permission))
            {
                role.Permissions.Add(new RolePermission(role.Id, permission));
            }
        }

        return role;
    }

    private static async Task<(Tenant Tenant, Resource DefaultResource)> EnsureDefaultTenantAsync(AppDbContext context, CancellationToken cancellationToken)
    {
        var tenant = await context.Tenants
            .FirstOrDefaultAsync(t => t.Domain == "platform.agnostic.local", cancellationToken);

        if (tenant is null)
        {
            tenant = new Tenant("Agnostic Platform", "platform.agnostic.local", "agnostic-dark");
            context.Tenants.Add(tenant);
        }

        var resource = await context.Resources
            .FirstOrDefaultAsync(r => r.TenantId == tenant.Id && r.Name == "Ana Salon", cancellationToken);

        if (resource is null)
        {
            resource = new Resource(tenant.Id, "Ana Salon", 24);
            context.Resources.Add(resource);
        }

        return (tenant, resource);
    }

    private static async Task EnsureDefaultParametersAsync(AppDbContext context, Tenant tenant, Resource defaultResource, CancellationToken cancellationToken)
    {
        var defaultResourceId = defaultResource.Id;

        await UpsertParameterAsync(context, tenant.Id, TenantParameterKeys.Categories.Auth, TenantParameterKeys.Auth.RequireKvkk, "true", false, cancellationToken);
        await UpsertParameterAsync(context, tenant.Id, TenantParameterKeys.Categories.Auth, TenantParameterKeys.Auth.KvkkText, "KVKK metni için yer tutucu.", false, cancellationToken);
        await UpsertParameterAsync(context, tenant.Id, TenantParameterKeys.Categories.Auth, TenantParameterKeys.Auth.RequireTwoFactor, "false", false, cancellationToken);
        await UpsertParameterAsync(context, tenant.Id, TenantParameterKeys.Categories.Auth, TenantParameterKeys.Auth.TwoFactorProvider, "email", false, cancellationToken);

        await UpsertParameterAsync(context, tenant.Id, TenantParameterKeys.Categories.Shop, TenantParameterKeys.Shop.DefaultShopId, defaultResourceId.ToString(), false, cancellationToken);
        await UpsertParameterAsync(context, tenant.Id, TenantParameterKeys.Categories.Shop, TenantParameterKeys.Shop.DefaultShopName, defaultResource.Name, false, cancellationToken);
        await UpsertParameterAsync(context, tenant.Id, TenantParameterKeys.Categories.Shop, TenantParameterKeys.Shop.DefaultShopTimeZone, "Europe/Istanbul", false, cancellationToken);

        await UpsertParameterAsync(context, tenant.Id, TenantParameterKeys.Categories.Logging, TenantParameterKeys.Logging.EnableGeneral, "true", false, cancellationToken);
        await UpsertParameterAsync(context, tenant.Id, TenantParameterKeys.Categories.Logging, TenantParameterKeys.Logging.EnableAccounting, "true", false, cancellationToken);
    }

    private static async Task UpsertParameterAsync(
        AppDbContext context,
        Guid tenantId,
        string category,
        string key,
        string value,
        bool isSecret,
        CancellationToken cancellationToken)
    {
        var parameter = await context.TenantParameters
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Key == key, cancellationToken);

        if (parameter is null)
        {
            context.TenantParameters.Add(new TenantParameter(tenantId, category, key, value, isSecret));
            return;
        }

        parameter.UpdateValue(value);
        parameter.UpdateSecret(isSecret);
    }

    private static async Task EnsureAdminUsersAsync(
        AppDbContext context,
        Tenant tenant,
        IReadOnlyDictionary<string, Role> roles,
        CancellationToken cancellationToken)
    {
        var superUserEmail = "super@agnostic.local";
        var tenantAdminEmail = "admin@agnostic.local";

        await EnsureAdminUserAsync(context, tenant, roles["SuperUser"], superUserEmail, "Agnostic Super User", cancellationToken);
        await EnsureAdminUserAsync(context, tenant, roles["TenantAdmin"], tenantAdminEmail, "Tenant Administrator", cancellationToken);
    }

    private static async Task EnsureAdminUserAsync(
        AppDbContext context,
        Tenant tenant,
        Role role,
        string email,
        string fullName,
        CancellationToken cancellationToken)
    {
        var user = await context.Users.Include(u => u.Preference)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user is not null)
        {
            return;
        }

        const string defaultPassword = "ChangeMe!123";
        var passwordHash = HashPassword(defaultPassword);

        user = new User(tenant.Id, email, passwordHash, role, tenant.DefaultTheme, fullName);
        user.EnableMultiFactor(true);

        context.Users.Add(user);
        context.NotificationPreferences.Add(user.Preference);
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}

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
    private static readonly TenantSeed PrimaryTenant = new(
        Guid.Parse("92d4f35e-bc1d-4c48-9c8a-7f8c5f5a2b11"),
        "Agnostic Hospitality Group",
        "platform.agnostic.local",
        "agnostic-dark");

    private static readonly TenantSeed[] SupplementaryTenants =
    {
        new(
            Guid.Parse("6a1f0c2d-4333-47ba-8fbc-4d8b25c11ec3"),
            "Eurasia City Escapes",
            "eurasia.agnostic.local",
            "agnostic-light"),
        new(
            Guid.Parse("01d2b496-6be4-4ae0-94f4-2eb1b876fae2"),
            "Anatolia Boutique Hotels",
            "anatolia.agnostic.local",
            "agnostic-light")
    };

    public static async Task InitializeAsync(AppDbContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        await context.Database.MigrateAsync(cancellationToken);

        var roles = await EnsureRolesAsync(context, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var (defaultTenant, defaultResource) = await EnsureDefaultTenantAsync(context, cancellationToken);
        await EnsureSupplementaryTenantsAsync(context, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        await EnsureDefaultParametersAsync(context, defaultTenant, defaultResource, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        await EnsureAdminUsersAsync(context, defaultTenant, roles, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        await EnsureShopUsersAndSampleDataAsync(context, defaultTenant, roles, cancellationToken);
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
            .FirstOrDefaultAsync(t => t.Id == PrimaryTenant.Id, cancellationToken);

        if (tenant is null)
        {
            tenant = new Tenant(PrimaryTenant.Id, PrimaryTenant.Name, PrimaryTenant.Domain, PrimaryTenant.DefaultTheme);
            context.Tenants.Add(tenant);
        }
        else
        {
            tenant.UpdateDetails(PrimaryTenant.Name, PrimaryTenant.Domain, PrimaryTenant.DefaultTheme);
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

    private static async Task EnsureSupplementaryTenantsAsync(AppDbContext context, CancellationToken cancellationToken)
    {
        foreach (var seed in SupplementaryTenants)
        {
            var tenant = await context.Tenants.FirstOrDefaultAsync(t => t.Id == seed.Id, cancellationToken);

            if (tenant is null)
            {
                tenant = new Tenant(seed.Id, seed.Name, seed.Domain, seed.DefaultTheme);
                context.Tenants.Add(tenant);
                continue;
            }

            tenant.UpdateDetails(seed.Name, seed.Domain, seed.DefaultTheme);
        }
    }

    private record TenantSeed(Guid Id, string Name, string Domain, string DefaultTheme);

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

        await EnsureUserAsync(context, tenant, roles["SuperUser"], superUserEmail, "Agnostic Super User", cancellationToken);
        await EnsureUserAsync(context, tenant, roles["TenantAdmin"], tenantAdminEmail, "Tenant Administrator", cancellationToken);
    }

    private static async Task<User> EnsureUserAsync(
        AppDbContext context,
        Tenant tenant,
        Role role,
        string email,
        string fullName,
        CancellationToken cancellationToken)
    {
        var user = await context.Users.Include(u => u.Preference)
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user is not null)
        {
            return user;
        }

        const string defaultPassword = "ChangeMe!123";
        var passwordHash = HashPassword(defaultPassword);

        user = new User(tenant.Id, email, passwordHash, role, tenant.DefaultTheme, fullName);
        user.EnableMultiFactor(true);
        user.UpdateContact(
            phoneNumber: "+90 212 000 00 00",
            addressLine1: "Teknopark İstanbul",
            addressLine2: "B2 Blok",
            city: "İstanbul",
            country: "Türkiye",
            postalCode: "34906");
        user.UpdateBilling(
            billingName: fullName,
            taxNumber: "1234567890",
            billingAddress: "Teknopark İstanbul B2 Blok",
            billingCity: "İstanbul",
            billingCountry: "Türkiye",
            billingPostalCode: "34906");

        context.Users.Add(user);
        context.NotificationPreferences.Add(user.Preference);

        return user;
    }

    private static async Task EnsureShopUsersAndSampleDataAsync(
        AppDbContext context,
        Tenant tenant,
        IReadOnlyDictionary<string, Role> roles,
        CancellationToken cancellationToken)
    {
        var shopManager = await EnsureUserAsync(context, tenant, roles["ShopAdmin"], "store.manager@agnostic.local", "Mağaza Yöneticisi", cancellationToken);
        var frontDesk = await EnsureUserAsync(context, tenant, roles["ShopStaff"], "frontdesk@agnostic.local", "Ön Büro Sorumlusu", cancellationToken);
        var accountingUser = await EnsureUserAsync(context, tenant, roles["Accounting"], "accounting@agnostic.local", "Gelir Uzmanı", cancellationToken);

        var resources = await EnsureDemoResourcesAsync(context, tenant, cancellationToken);
        await EnsureSampleReservationsAsync(context, tenant, shopManager, frontDesk, resources, cancellationToken);
        await EnsureSamplePaymentsAsync(context, tenant, cancellationToken);
        await EnsureSampleSessionsAsync(context, tenant, new[] { shopManager, frontDesk, accountingUser }, cancellationToken);
    }

    private static async Task<IReadOnlyList<Resource>> EnsureDemoResourcesAsync(AppDbContext context, Tenant tenant, CancellationToken cancellationToken)
    {
        var desired = new (string Name, int Capacity)[]
        {
            ("Oda A", 12),
            ("Oda B", 8),
            ("Oda C", 16),
        };

        var resources = new List<Resource>();
        foreach (var (name, capacity) in desired)
        {
            var resource = await context.Resources.FirstOrDefaultAsync(r => r.TenantId == tenant.Id && r.Name == name, cancellationToken);
            if (resource is null)
            {
                resource = new Resource(tenant.Id, name, capacity);
                context.Resources.Add(resource);
            }

            resources.Add(resource);
        }

        return resources;
    }

    private static async Task EnsureSampleReservationsAsync(
        AppDbContext context,
        Tenant tenant,
        User shopManager,
        User frontDesk,
        IReadOnlyList<Resource> resources,
        CancellationToken cancellationToken)
    {
        if (await context.Reservations.AnyAsync(r => r.TenantId == tenant.Id, cancellationToken))
        {
            return;
        }

        var baseDate = DateTime.UtcNow;
        var roomA = resources.FirstOrDefault(r => r.Name == "Oda A") ?? resources.First();
        var roomB = resources.FirstOrDefault(r => r.Name == "Oda B") ?? resources.First();
        var roomC = resources.FirstOrDefault(r => r.Name == "Oda C") ?? resources.First();

        var reservations = new List<Reservation>
        {
            new Reservation(tenant.Id, roomA.Id, shopManager.Id, baseDate.AddDays(-2).AddHours(8), baseDate.AddDays(-2).AddHours(12), ReservationStatus.Completed, baseDate.AddDays(-3)),
            new Reservation(tenant.Id, roomB.Id, shopManager.Id, baseDate.AddDays(-1).AddHours(14), baseDate.AddDays(-1).AddHours(18), ReservationStatus.Completed, baseDate.AddDays(-2)),
            new Reservation(tenant.Id, roomC.Id, frontDesk.Id, baseDate.AddHours(2), baseDate.AddHours(5), ReservationStatus.Confirmed, baseDate.AddHours(-1)),
            new Reservation(tenant.Id, roomA.Id, frontDesk.Id, baseDate.AddDays(1).AddHours(9), baseDate.AddDays(1).AddHours(11), ReservationStatus.Confirmed, baseDate),
            new Reservation(tenant.Id, roomB.Id, shopManager.Id, baseDate.AddDays(3).AddHours(13), baseDate.AddDays(3).AddHours(17), ReservationStatus.Pending, baseDate),
            new Reservation(tenant.Id, roomC.Id, frontDesk.Id, baseDate.AddDays(7).AddHours(10), baseDate.AddDays(7).AddHours(15), ReservationStatus.Pending, baseDate),
        };

        context.Reservations.AddRange(reservations);
    }

    private static async Task EnsureSamplePaymentsAsync(AppDbContext context, Tenant tenant, CancellationToken cancellationToken)
    {
        if (await context.PaymentTransactions.AnyAsync(p => p.TenantId == tenant.Id, cancellationToken))
        {
            return;
        }

        var reservations = await context.Reservations.Where(r => r.TenantId == tenant.Id).ToListAsync(cancellationToken);
        if (reservations.Count == 0)
        {
            return;
        }

        var primaryResourceId = reservations.First().ResourceId;
        foreach (var reservation in reservations)
        {
            var amount = reservation.ResourceId == primaryResourceId ? 4200m : 3600m;
            var provider = reservation.ResourceId == primaryResourceId ? "iyzico" : "stripe";
            var payment = new PaymentTransaction(tenant.Id, reservation.Id, amount, "TRY", provider, "Pending", reservation.CreatedAt);

            if (reservation.Status is ReservationStatus.Completed or ReservationStatus.Confirmed)
            {
                payment.MarkAsPaid(reservation.EndUtc);
            }
            else if (reservation.Status == ReservationStatus.Pending && reservation.StartUtc < DateTime.UtcNow)
            {
                payment.MarkAsFailed(reservation.EndUtc);
            }

            context.PaymentTransactions.Add(payment);
        }
    }

    private static async Task EnsureSampleSessionsAsync(
        AppDbContext context,
        Tenant tenant,
        IEnumerable<User> users,
        CancellationToken cancellationToken)
    {
        if (await context.UserSessions.AnyAsync(s => s.TenantId == tenant.Id, cancellationToken))
        {
            return;
        }

        foreach (var user in users)
        {
            var deviceId = user.Role.Name switch
            {
                "ShopAdmin" => "mobile-store-manager",
                "Accounting" => "backoffice-analytics",
                _ => "mobile-frontdesk",
            };

            var session = new UserSession(tenant.Id, user.Id, deviceId, GenerateSampleToken(user.Id), GenerateSampleToken(user.Id, true));
            context.UserSessions.Add(session);
        }
    }

    private static string GenerateSampleToken(Guid userId, bool refresh = false)
        => Convert.ToBase64String(Encoding.UTF8.GetBytes($"{userId}:{(refresh ? "refresh" : "access")}:seed"));

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}

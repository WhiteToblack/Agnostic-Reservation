using System.Linq;
using AgnosticReservation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace AgnosticReservation.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<TenantParameter> TenantParameters => Set<TenantParameter>();
    public DbSet<TenantParameterChangeRequest> TenantParameterChangeRequests => Set<TenantParameterChangeRequest>();
    public DbSet<Resource> Resources => Set<Resource>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DashboardDefinition> Dashboards => Set<DashboardDefinition>();
    public DbSet<DashboardWidget> DashboardWidgets => Set<DashboardWidget>();
    public DbSet<StockItem> StockItems => Set<StockItem>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderLine> PurchaseOrderLines => Set<PurchaseOrderLine>();
    public DbSet<ServicePackage> ServicePackages => Set<ServicePackage>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        var decimalProperties = modelBuilder.Model
            .GetEntityTypes()
            .SelectMany(entity => entity.GetProperties())
            .Where(property => property.ClrType == typeof(decimal) || property.ClrType == typeof(decimal?));

        foreach (var property in decimalProperties)
        {
            property.SetPrecision(18);
            property.SetScale(2);
        }
    }
}

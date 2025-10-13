using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Application.Dashboard;

public interface IDashboardService
{
    Task<DashboardDefinition> GetForRoleAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DashboardWidget>> ListWidgetsAsync(Guid dashboardId, CancellationToken cancellationToken = default);
}

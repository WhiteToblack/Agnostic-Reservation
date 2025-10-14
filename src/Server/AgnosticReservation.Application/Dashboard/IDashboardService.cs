using System.Collections.Generic;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Application.Dashboard;

public interface IDashboardService
{
    Task<DashboardDefinition> GetForRoleAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken = default);
    Task<DashboardDefinition> GetForUserAsync(Guid tenantId, Guid roleId, Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DashboardWidget>> ListWidgetsAsync(Guid dashboardId, CancellationToken cancellationToken = default);
    Task UpdateUserLayoutAsync(Guid dashboardId, string? layoutConfigJson, IReadOnlyCollection<DashboardWidgetUpdateModel> widgetUpdates, CancellationToken cancellationToken = default);
}

public record DashboardWidgetUpdateModel(Guid Id, int Order, string? ConfigJson);

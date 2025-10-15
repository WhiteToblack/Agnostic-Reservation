using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Application.Dashboard.Models;

namespace AgnosticReservation.Application.Dashboard;

public interface IDashboardService
{
    Task<DashboardDefinition> GetForRoleAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DashboardWidget>> ListWidgetsAsync(Guid dashboardId, CancellationToken cancellationToken = default);
    Task<DashboardInsights> GetInsightsAsync(Guid tenantId, Guid? userId, CancellationToken cancellationToken = default);
}

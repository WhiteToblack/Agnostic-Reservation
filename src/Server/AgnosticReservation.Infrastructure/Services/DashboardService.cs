using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Dashboard;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly IRepository<DashboardDefinition> _dashboardRepository;
    private readonly IRepository<DashboardWidget> _widgetRepository;

    public DashboardService(IRepository<DashboardDefinition> dashboardRepository, IRepository<DashboardWidget> widgetRepository)
    {
        _dashboardRepository = dashboardRepository;
        _widgetRepository = widgetRepository;
    }

    public async Task<DashboardDefinition> GetForRoleAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken = default)
    {
        var dashboards = await _dashboardRepository.ListAsync(d => d.TenantId == tenantId && d.RoleId == roleId, cancellationToken);
        var dashboard = dashboards.FirstOrDefault();
        if (dashboard is null)
        {
            dashboard = new DashboardDefinition(tenantId, roleId);
            await _dashboardRepository.AddAsync(dashboard, cancellationToken);
        }

        return dashboard;
    }

    public Task<IReadOnlyList<DashboardWidget>> ListWidgetsAsync(Guid dashboardId, CancellationToken cancellationToken = default)
        => _widgetRepository.ListAsync(w => w.DashboardDefinitionId == dashboardId, cancellationToken);
}

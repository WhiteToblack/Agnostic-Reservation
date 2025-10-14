using System;
using System.Collections.Generic;
using System.Linq;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Dashboard;
using AgnosticReservation.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace AgnosticReservation.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly IRepository<DashboardDefinition> _dashboardRepository;
    private readonly IRepository<DashboardWidget> _widgetRepository;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(IRepository<DashboardDefinition> dashboardRepository, IRepository<DashboardWidget> widgetRepository, ILogger<DashboardService> logger)
    {
        _dashboardRepository = dashboardRepository;
        _widgetRepository = widgetRepository;
        _logger = logger;
    }

    public async Task<DashboardDefinition> GetForRoleAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken = default)
    {
        var dashboards = await _dashboardRepository.ListAsync(d => d.TenantId == tenantId && d.RoleId == roleId && d.UserId == null, cancellationToken);
        var dashboard = dashboards.FirstOrDefault();
        if (dashboard is null)
        {
            dashboard = new DashboardDefinition(tenantId, roleId);
            await _dashboardRepository.AddAsync(dashboard, cancellationToken);
            _logger.LogInformation("Created default dashboard {DashboardId} for tenant {TenantId} role {RoleId}", dashboard.Id, tenantId, roleId);
        }

        return dashboard;
    }

    public async Task<DashboardDefinition> GetForUserAsync(Guid tenantId, Guid roleId, Guid userId, CancellationToken cancellationToken = default)
    {
        var dashboards = await _dashboardRepository.ListAsync(d => d.TenantId == tenantId && d.RoleId == roleId && d.UserId == userId, cancellationToken);
        var dashboard = dashboards.FirstOrDefault();
        if (dashboard is not null)
        {
            _logger.LogDebug("Found existing dashboard {DashboardId} for user {UserId}", dashboard.Id, userId);
            return dashboard;
        }

        var roleDashboard = await GetForRoleAsync(tenantId, roleId, cancellationToken);
        dashboard = new DashboardDefinition(tenantId, roleId, userId, roleDashboard.LayoutConfigJson);
        await _dashboardRepository.AddAsync(dashboard, cancellationToken);

        var defaultWidgets = await ListWidgetsAsync(roleDashboard.Id, cancellationToken);
        foreach (var widget in defaultWidgets.OrderBy(w => w.Order))
        {
            var clone = new DashboardWidget(dashboard.Id, widget.WidgetType, widget.Order, widget.ConfigJson);
            await _widgetRepository.AddAsync(clone, cancellationToken);
        }

        _logger.LogInformation("Created personal dashboard {DashboardId} for user {UserId} from role dashboard {RoleDashboardId}", dashboard.Id, userId, roleDashboard.Id);
        return dashboard;
    }

    public Task<IReadOnlyList<DashboardWidget>> ListWidgetsAsync(Guid dashboardId, CancellationToken cancellationToken = default)
        => _widgetRepository.ListAsync(w => w.DashboardDefinitionId == dashboardId, cancellationToken);

    public async Task UpdateUserLayoutAsync(Guid dashboardId, string? layoutConfigJson, IReadOnlyCollection<DashboardWidgetUpdateModel> widgetUpdates, CancellationToken cancellationToken = default)
    {
        var dashboard = await _dashboardRepository.GetAsync(dashboardId, cancellationToken);
        if (dashboard is null)
        {
            throw new InvalidOperationException($"Dashboard {dashboardId} was not found");
        }

        var hasLayoutChange = !string.Equals(dashboard.LayoutConfigJson, layoutConfigJson, StringComparison.Ordinal);
        if (hasLayoutChange)
        {
            dashboard.UpdateLayoutConfig(layoutConfigJson);
            await _dashboardRepository.UpdateAsync(dashboard, cancellationToken);
            _logger.LogInformation("Updated layout config for dashboard {DashboardId}", dashboardId);
        }

        if (widgetUpdates.Count == 0)
        {
            return;
        }

        var existingWidgets = await _widgetRepository.ListAsync(w => w.DashboardDefinitionId == dashboardId, cancellationToken);
        var widgetLookup = existingWidgets.ToDictionary(w => w.Id);

        foreach (var update in widgetUpdates)
        {
            if (!widgetLookup.TryGetValue(update.Id, out var widget))
            {
                _logger.LogWarning("Skipping update for widget {WidgetId} because it was not found on dashboard {DashboardId}", update.Id, dashboardId);
                continue;
            }

            widget.UpdateOrder(update.Order);
            widget.UpdateConfig(update.ConfigJson);
            await _widgetRepository.UpdateAsync(widget, cancellationToken);
            _logger.LogDebug("Updated widget {WidgetId} on dashboard {DashboardId}", update.Id, dashboardId);
        }
    }
}

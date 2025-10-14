using System;
using System.Collections.Generic;
using System.Linq;
using AgnosticReservation.Application.Dashboard;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(IDashboardService dashboardService, ILogger<DashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> Get([FromQuery] Guid tenantId, [FromQuery] Guid roleId, CancellationToken cancellationToken)
    {
        var dashboard = await _dashboardService.GetForRoleAsync(tenantId, roleId, cancellationToken);
        var widgets = await _dashboardService.ListWidgetsAsync(dashboard.Id, cancellationToken);
        return Ok(new { dashboard, widgets });
    }

    [HttpGet("user")]
    public async Task<ActionResult> GetForUser([FromQuery] Guid tenantId, [FromQuery] Guid roleId, [FromQuery] Guid userId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Fetching dashboard for user {UserId} in tenant {TenantId} role {RoleId}", userId, tenantId, roleId);
        var dashboard = await _dashboardService.GetForUserAsync(tenantId, roleId, userId, cancellationToken);
        var widgets = await _dashboardService.ListWidgetsAsync(dashboard.Id, cancellationToken);
        return Ok(new { dashboard, widgets });
    }

    [HttpPut("user/{dashboardId:guid}")]
    public async Task<ActionResult> UpdateUserDashboard(Guid dashboardId, [FromBody] UpdateDashboardRequest request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating dashboard {DashboardId} with {WidgetCount} widgets", dashboardId, request.Widgets.Count);
        var updates = request.Widgets
            .Select(widget => new DashboardWidgetUpdateModel(widget.Id, widget.Order, widget.ConfigJson))
            .ToList();

        await _dashboardService.UpdateUserLayoutAsync(dashboardId, request.LayoutConfig, updates, cancellationToken);
        return NoContent();
    }
}

public class UpdateDashboardRequest
{
    public string? LayoutConfig { get; init; }
    public IList<UpdateDashboardWidgetRequest> Widgets { get; init; } = new List<UpdateDashboardWidgetRequest>();
}

public class UpdateDashboardWidgetRequest
{
    public Guid Id { get; init; }
    public int Order { get; init; }
    public string? ConfigJson { get; init; }
}

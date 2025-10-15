using System;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Dashboard;
using AgnosticReservation.Application.Dashboard.Models;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<ActionResult> Get([FromQuery] Guid tenantId, [FromQuery] Guid roleId, CancellationToken cancellationToken)
    {
        var dashboard = await _dashboardService.GetForRoleAsync(tenantId, roleId, cancellationToken);
        var widgets = await _dashboardService.ListWidgetsAsync(dashboard.Id, cancellationToken);
        return Ok(new { dashboard, widgets });
    }

    [HttpGet("insights")]
    public async Task<ActionResult<DashboardInsights>> GetInsights([FromQuery] Guid tenantId, [FromQuery] Guid? userId, CancellationToken cancellationToken)
    {
        var insights = await _dashboardService.GetInsightsAsync(tenantId, userId, cancellationToken);
        return Ok(insights);
    }
}

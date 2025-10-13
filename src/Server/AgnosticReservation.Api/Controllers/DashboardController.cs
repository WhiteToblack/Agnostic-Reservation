using AgnosticReservation.Application.Dashboard;
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
}

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Admin;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/admin/navigation")]
public class AdminNavigationController : ControllerBase
{
    private readonly IAdminNavigationService _navigationService;

    public AdminNavigationController(IAdminNavigationService navigationService)
    {
        _navigationService = navigationService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminModule>>> Get([FromQuery] Guid tenantId, [FromQuery] Guid userId, CancellationToken cancellationToken)
    {
        var modules = await _navigationService.GetModulesAsync(tenantId, userId, cancellationToken);
        return Ok(modules);
    }
}

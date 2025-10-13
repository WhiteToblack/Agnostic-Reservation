using AgnosticReservation.Application.Admin;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/admin/cache")]
public class AdminCacheController : ControllerBase
{
    private readonly ICacheService _cacheService;

    public AdminCacheController(ICacheService cacheService)
    {
        _cacheService = cacheService;
    }

    [HttpDelete]
    public async Task<IActionResult> Clear([FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        await _cacheService.ClearTenantAsync(tenantId, cancellationToken);
        return NoContent();
    }
}

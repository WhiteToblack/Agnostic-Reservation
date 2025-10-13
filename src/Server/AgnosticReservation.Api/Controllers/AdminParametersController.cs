using AgnosticReservation.Application.Admin;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/admin/parameters")]
public class AdminParametersController : ControllerBase
{
    private readonly IParameterService _parameterService;

    public AdminParametersController(IParameterService parameterService)
    {
        _parameterService = parameterService;
    }

    [HttpGet]
    public async Task<ActionResult> Get([FromQuery] Guid tenantId, [FromQuery] string? category, CancellationToken cancellationToken)
    {
        var parameters = await _parameterService.GetAsync(tenantId, category, cancellationToken);
        return Ok(parameters);
    }

    [HttpPost]
    public async Task<ActionResult> Upsert([FromQuery] Guid tenantId, [FromQuery] string category, [FromQuery] string key, [FromBody] string value, [FromQuery] bool isSecret, CancellationToken cancellationToken)
    {
        var parameter = await _parameterService.UpsertAsync(tenantId, category, key, value, isSecret, cancellationToken);
        return Ok(parameter);
    }

    [HttpDelete("{parameterId:guid}")]
    public async Task<IActionResult> Delete(Guid parameterId, [FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        await _parameterService.RemoveAsync(tenantId, parameterId, cancellationToken);
        return NoContent();
    }

    [HttpPost("invalidate")]
    public async Task<IActionResult> Invalidate([FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        await _parameterService.InvalidateCacheAsync(tenantId, cancellationToken);
        return NoContent();
    }
}

using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Context;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/admin/parameters")]
public class AdminParametersController : ControllerBase
{
    private readonly IParameterService _parameterService;
    private readonly ISessionContextAccessor _sessionContextAccessor;

    public AdminParametersController(IParameterService parameterService, ISessionContextAccessor sessionContextAccessor)
    {
        _parameterService = parameterService;
        _sessionContextAccessor = sessionContextAccessor;
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
        var session = _sessionContextAccessor.Current;
        var user = session.User ?? throw new InvalidOperationException("Aktif kullanıcı bilgisi bulunamadı");
        var result = await _parameterService.UpsertAsync(tenantId, category, key, value, isSecret, user.Id, user.IsSuperAdmin, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{parameterId:guid}")]
    public async Task<IActionResult> Delete(Guid parameterId, [FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        var session = _sessionContextAccessor.Current;
        var user = session.User ?? throw new InvalidOperationException("Aktif kullanıcı bilgisi bulunamadı");
        var result = await _parameterService.RemoveAsync(tenantId, parameterId, user.Id, user.IsSuperAdmin, cancellationToken);
        return Ok(result);
    }

    [HttpPost("invalidate")]
    public async Task<IActionResult> Invalidate([FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        await _parameterService.InvalidateCacheAsync(tenantId, cancellationToken);
        return NoContent();
    }
}

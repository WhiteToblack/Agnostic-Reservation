using System.Collections.Generic;
using AgnosticReservation.Application.Context;
using AgnosticReservation.Application.Localization;
using AgnosticReservation.Application.Localization.Models;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/admin/localization")]
public class AdminLocalizationController : ControllerBase
{
    private readonly ILocalizationService _localizationService;
    private readonly ISessionContextAccessor _sessionContextAccessor;

    public AdminLocalizationController(ILocalizationService localizationService, ISessionContextAccessor sessionContextAccessor)
    {
        _localizationService = localizationService;
        _sessionContextAccessor = sessionContextAccessor;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LocalizationKeyDto>>> Get([FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        var keys = await _localizationService.GetKeysAsync(tenantId, cancellationToken);
        return Ok(keys);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromQuery] Guid tenantId, [FromBody] LocalizationUpsertRequest request, CancellationToken cancellationToken)
    {
        var user = _sessionContextAccessor.Current.User;
        await _localizationService.UpsertAsync(tenantId, request, user?.Id, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{keyId:guid}/translations/{language}")]
    public async Task<IActionResult> DeleteTranslation(Guid keyId, string language, [FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        await _localizationService.RemoveTranslationAsync(tenantId, keyId, language, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{keyId:guid}")]
    public async Task<IActionResult> DeleteKey(Guid keyId, [FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        await _localizationService.RemoveKeyAsync(tenantId, keyId, cancellationToken);
        return NoContent();
    }

    [HttpPost("invalidate")]
    public async Task<IActionResult> Invalidate([FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        await _localizationService.InvalidateCacheAsync(tenantId, cancellationToken);
        return NoContent();
    }
}

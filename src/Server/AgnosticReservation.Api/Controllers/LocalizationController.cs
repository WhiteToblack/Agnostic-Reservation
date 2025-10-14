using System.Collections.Generic;
using AgnosticReservation.Application.Context;
using AgnosticReservation.Application.Localization;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/localization")]
public class LocalizationController : ControllerBase
{
    private readonly ILocalizationService _localizationService;
    private readonly ISessionContextAccessor _sessionContextAccessor;

    public LocalizationController(ILocalizationService localizationService, ISessionContextAccessor sessionContextAccessor)
    {
        _localizationService = localizationService;
        _sessionContextAccessor = sessionContextAccessor;
    }

    [HttpGet]
    public async Task<ActionResult<object>> Get([FromQuery] Guid tenantId, [FromQuery] string? language, CancellationToken cancellationToken)
    {
        var resolvedLanguage = ResolveLanguage(language);
        var translations = await _localizationService.GetTranslationsAsync(tenantId, resolvedLanguage, cancellationToken);
        return Ok(new LocalizationResponse(resolvedLanguage, translations));
    }

    private string ResolveLanguage(string? language)
    {
        if (!string.IsNullOrWhiteSpace(language))
        {
            return language;
        }

        var sessionUser = _sessionContextAccessor.Current.User;
        if (sessionUser is not null && !string.IsNullOrWhiteSpace(sessionUser.PreferredLanguage))
        {
            return sessionUser.PreferredLanguage;
        }

        return "tr-TR";
    }

    private sealed record LocalizationResponse(string Language, IReadOnlyDictionary<string, string> Translations);
}

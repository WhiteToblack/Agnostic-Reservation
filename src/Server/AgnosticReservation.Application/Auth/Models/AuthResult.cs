using AgnosticReservation.Application.Context;

namespace AgnosticReservation.Application.Auth.Models;

public record AuthResult(
    Guid UserId,
    Guid TenantId,
    string Email,
    string? AccessToken,
    string? RefreshToken,
    string PreferredTheme,
    string PreferredLanguage,
    bool TwoFactorPending,
    AuthFeatureSettings Features,
    SessionContextData Session);

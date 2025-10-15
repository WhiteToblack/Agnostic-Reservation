using System;
using AgnosticReservation.Application.Context;

namespace AgnosticReservation.Application.Auth.Models;

public record SessionResume(
    Guid SessionId,
    Guid UserId,
    Guid TenantId,
    string Email,
    string FullName,
    string PreferredTheme,
    string PreferredLanguage,
    DateTime LastActivityUtc,
    string? AccessToken,
    string? RefreshToken,
    SessionContextData Session);

using System;

namespace AgnosticReservation.Application.Auth.Models;

public record SignUpRequest(
    Guid TenantId,
    string Email,
    string Password,
    string FullName,
    string PreferredTheme,
    string PreferredLanguage = "tr-TR",
    bool AcceptKvkk = false,
    string? DeviceId = null,
    Guid? ShopId = null,
    string? ShopName = null,
    string? ShopTimeZone = null);

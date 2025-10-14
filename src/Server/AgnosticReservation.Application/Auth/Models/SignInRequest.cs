namespace AgnosticReservation.Application.Auth.Models;

public record SignInRequest(
    string Email,
    string Password,
    Guid TenantId,
    Guid? ShopId = null,
    string? ShopName = null,
    string? ShopTimeZone = null);

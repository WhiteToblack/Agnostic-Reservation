namespace AgnosticReservation.Application.Auth.Models;

public record SignUpRequest(Guid TenantId, string Email, string Password, string FullName, string PreferredTheme);

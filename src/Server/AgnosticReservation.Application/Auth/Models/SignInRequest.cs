namespace AgnosticReservation.Application.Auth.Models;

public record SignInRequest(string Email, string Password, Guid TenantId);

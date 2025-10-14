namespace AgnosticReservation.Application.Auth.Models;

public record AuthFeatureSettings(
    bool RequireKvkkAcceptance,
    string? KvkkText,
    bool RequireTwoFactor,
    string? TwoFactorProvider);

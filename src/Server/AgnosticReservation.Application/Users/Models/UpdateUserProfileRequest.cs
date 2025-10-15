namespace AgnosticReservation.Application.Users.Models;

public record UpdateUserProfileRequest(
    string? FullName,
    string? PreferredTheme,
    string? PreferredLanguage,
    string? PhoneNumber,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? Country,
    string? PostalCode,
    string? BillingName,
    string? BillingTaxNumber,
    string? BillingAddress,
    string? BillingCity,
    string? BillingCountry,
    string? BillingPostalCode);

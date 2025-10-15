using System;

namespace AgnosticReservation.Application.Users.Models;

public record UserProfileDto(
    Guid UserId,
    Guid TenantId,
    string Email,
    string FullName,
    string PreferredTheme,
    string PreferredLanguage,
    string PhoneNumber,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string Country,
    string PostalCode,
    string BillingName,
    string BillingTaxNumber,
    string BillingAddress,
    string BillingCity,
    string BillingCountry,
    string BillingPostalCode);

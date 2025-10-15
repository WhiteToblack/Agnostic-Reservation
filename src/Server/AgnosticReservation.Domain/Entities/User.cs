using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Domain.Entities;

public class User : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Tenant Tenant { get; private set; } = default!;
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }
    public string FullName { get; private set; }
    public Guid RoleId { get; private set; }
    public Role Role { get; private set; } = default!;
    public string PreferredTheme { get; private set; }
    public string PreferredLanguage { get; private set; }
    public bool MultiFactorEnabled { get; private set; }
    public NotificationPreference Preference { get; private set; }
    public string PhoneNumber { get; private set; }
    public string AddressLine1 { get; private set; }
    public string? AddressLine2 { get; private set; }
    public string City { get; private set; }
    public string Country { get; private set; }
    public string PostalCode { get; private set; }
    public string BillingName { get; private set; }
    public string BillingTaxNumber { get; private set; }
    public string BillingAddress { get; private set; }
    public string BillingCity { get; private set; }
    public string BillingCountry { get; private set; }
    public string BillingPostalCode { get; private set; }

    private User() : base()
    {
        Email = string.Empty;
        PasswordHash = string.Empty;
        FullName = string.Empty;
        PreferredTheme = "inherit";
        PreferredLanguage = "tr-TR";
        Preference = new NotificationPreference(Guid.Empty, true, true, false, NotificationChannel.Email);
        PhoneNumber = string.Empty;
        AddressLine1 = string.Empty;
        City = string.Empty;
        Country = string.Empty;
        PostalCode = string.Empty;
        BillingName = string.Empty;
        BillingTaxNumber = string.Empty;
        BillingAddress = string.Empty;
        BillingCity = string.Empty;
        BillingCountry = string.Empty;
        BillingPostalCode = string.Empty;
    }

    public User(Guid tenantId, string email, string passwordHash, Role role, string preferredTheme = "inherit", string? fullName = null, string preferredLanguage = "tr-TR")
    {
        TenantId = tenantId;
        Email = email;
        PasswordHash = passwordHash;
        Role = role;
        RoleId = role.Id;
        PreferredTheme = preferredTheme;
        FullName = fullName ?? email;
        PreferredLanguage = preferredLanguage;
        Preference = new NotificationPreference(Id, push: true, email: true, sms: false, NotificationChannel.Email);
        PhoneNumber = string.Empty;
        AddressLine1 = string.Empty;
        City = string.Empty;
        Country = string.Empty;
        PostalCode = string.Empty;
        BillingName = string.Empty;
        BillingTaxNumber = string.Empty;
        BillingAddress = string.Empty;
        BillingCity = string.Empty;
        BillingCountry = string.Empty;
        BillingPostalCode = string.Empty;
    }

    public void UpdateTheme(string theme)
    {
        PreferredTheme = theme;
    }

    public void UpdateName(string fullName)
    {
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            FullName = fullName;
        }
    }

    public void EnableMultiFactor(bool enabled)
    {
        MultiFactorEnabled = enabled;
    }

    public void UpdateLanguage(string preferredLanguage)
    {
        if (!string.IsNullOrWhiteSpace(preferredLanguage))
        {
            PreferredLanguage = preferredLanguage;
        }
    }

    public void UpdatePreference(bool push, bool email, bool sms, NotificationChannel channel)
    {
        Preference.Update(push, email, sms, channel);
    }

    public void UpdateContact(
        string? phoneNumber,
        string? addressLine1,
        string? addressLine2,
        string? city,
        string? country,
        string? postalCode)
    {
        PhoneNumber = phoneNumber?.Trim() ?? string.Empty;
        AddressLine1 = addressLine1?.Trim() ?? string.Empty;
        AddressLine2 = string.IsNullOrWhiteSpace(addressLine2) ? null : addressLine2.Trim();
        City = city?.Trim() ?? string.Empty;
        Country = country?.Trim() ?? string.Empty;
        PostalCode = postalCode?.Trim() ?? string.Empty;
        Touch();
    }

    public void UpdateBilling(
        string? billingName,
        string? taxNumber,
        string? billingAddress,
        string? billingCity,
        string? billingCountry,
        string? billingPostalCode)
    {
        BillingName = billingName?.Trim() ?? string.Empty;
        BillingTaxNumber = taxNumber?.Trim() ?? string.Empty;
        BillingAddress = billingAddress?.Trim() ?? string.Empty;
        BillingCity = billingCity?.Trim() ?? string.Empty;
        BillingCountry = billingCountry?.Trim() ?? string.Empty;
        BillingPostalCode = billingPostalCode?.Trim() ?? string.Empty;
        Touch();
    }
}

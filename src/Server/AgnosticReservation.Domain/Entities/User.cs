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
    public bool MultiFactorEnabled { get; private set; }
    public NotificationPreference Preference { get; private set; }

    private User() : base()
    {
        Email = string.Empty;
        PasswordHash = string.Empty;
        FullName = string.Empty;
        PreferredTheme = "inherit";
        Preference = new NotificationPreference(Guid.Empty, true, true, false, NotificationChannel.Email);
    }

    public User(Guid tenantId, string email, string passwordHash, Role role, string preferredTheme = "inherit", string? fullName = null)
    {
        TenantId = tenantId;
        Email = email;
        PasswordHash = passwordHash;
        Role = role;
        RoleId = role.Id;
        PreferredTheme = preferredTheme;
        FullName = fullName ?? email;
        Preference = new NotificationPreference(Id, push: true, email: true, sms: false, NotificationChannel.Email);
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

    public void UpdatePreference(bool push, bool email, bool sms, NotificationChannel channel)
    {
        Preference.Update(push, email, sms, channel);
    }
}

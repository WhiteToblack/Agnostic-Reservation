namespace AgnosticReservation.Domain.Entities;

public class UserSession : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Guid UserId { get; private set; }
    public string DeviceId { get; private set; }
    public string? AccessToken { get; private set; }
    public string? RefreshToken { get; private set; }
    public DateTime LastActivityUtc { get; private set; }
    public bool IsActive { get; private set; }

    private UserSession()
    {
        DeviceId = string.Empty;
        IsActive = true;
        LastActivityUtc = DateTime.UtcNow;
    }

    public UserSession(Guid tenantId, Guid userId, string deviceId, string? accessToken, string? refreshToken)
    {
        TenantId = tenantId;
        UserId = userId;
        DeviceId = deviceId;
        AccessToken = accessToken;
        RefreshToken = refreshToken;
        LastActivityUtc = DateTime.UtcNow;
        IsActive = true;
    }

    public void UpdateTokens(string? accessToken, string? refreshToken)
    {
        AccessToken = accessToken;
        RefreshToken = refreshToken;
        Touch();
        LastActivityUtc = DateTime.UtcNow;
        IsActive = true;
    }

    public void TouchSession()
    {
        Touch();
        LastActivityUtc = DateTime.UtcNow;
        IsActive = true;
    }

    public void Close()
    {
        IsActive = false;
        Touch();
        LastActivityUtc = DateTime.UtcNow;
    }
}

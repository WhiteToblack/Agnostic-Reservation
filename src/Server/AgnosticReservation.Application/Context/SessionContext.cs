namespace AgnosticReservation.Application.Context;

public class SessionContext : ISessionContext
{
    public static SessionContext Empty { get; } = new(new SessionContextData(null, null, null, false));

    public SessionContext(SessionContextData data)
    {
        Snapshot = data;
        User = data.User;
        Tenant = data.Tenant;
        Shop = data.Shop;
        IsTwoFactorRequired = data.IsTwoFactorRequired;
    }

    public SessionUserInfo? User { get; }

    public SessionTenantInfo? Tenant { get; }

    public SessionShopInfo? Shop { get; }

    public bool IsTwoFactorRequired { get; }

    public SessionContextData Snapshot { get; }
}

namespace AgnosticReservation.Application.Context;

public interface ISessionContext
{
    SessionUserInfo? User { get; }
    SessionTenantInfo? Tenant { get; }
    SessionShopInfo? Shop { get; }
    bool IsTwoFactorRequired { get; }
    SessionContextData Snapshot { get; }
}

public interface ISessionContextAccessor
{
    ISessionContext Current { get; }
    void SetSession(SessionContextData data);
    void Clear();
}

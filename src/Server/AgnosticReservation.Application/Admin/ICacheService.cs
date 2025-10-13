namespace AgnosticReservation.Application.Admin;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
    Task ClearTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);
}

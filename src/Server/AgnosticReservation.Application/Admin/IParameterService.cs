using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Application.Admin;

public interface IParameterService
{
    Task<IReadOnlyList<TenantParameter>> GetAsync(Guid tenantId, string? category = null, CancellationToken cancellationToken = default);
    Task<TenantParameter> UpsertAsync(Guid tenantId, string category, string key, string value, bool isSecret, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid tenantId, Guid parameterId, CancellationToken cancellationToken = default);
    Task InvalidateCacheAsync(Guid tenantId, CancellationToken cancellationToken = default);
}

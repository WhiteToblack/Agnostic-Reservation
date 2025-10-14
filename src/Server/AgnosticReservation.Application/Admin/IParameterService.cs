using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Application.Admin;

public interface IParameterService
{
    Task<IReadOnlyList<TenantParameter>> GetAsync(Guid tenantId, string? category = null, CancellationToken cancellationToken = default);
    Task<ParameterChangeResult> UpsertAsync(Guid tenantId, string category, string key, string value, bool isSecret, Guid requestedBy, bool bypassApproval, CancellationToken cancellationToken = default);
    Task<ParameterChangeResult> RemoveAsync(Guid tenantId, Guid parameterId, Guid requestedBy, bool bypassApproval, CancellationToken cancellationToken = default);
    Task InvalidateCacheAsync(Guid tenantId, CancellationToken cancellationToken = default);
}

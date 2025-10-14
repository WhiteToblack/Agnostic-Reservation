using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Application.Admin;

public interface IParameterApprovalService
{
    Task<IReadOnlyList<TenantParameterChangeRequest>> GetPendingAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task ApproveAsync(Guid requestId, Guid approverId, CancellationToken cancellationToken = default);
    Task RejectAsync(Guid requestId, Guid approverId, string? reason, CancellationToken cancellationToken = default);
}

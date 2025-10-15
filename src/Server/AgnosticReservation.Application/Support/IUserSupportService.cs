using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Application.Support.Models;

namespace AgnosticReservation.Application.Support;

public interface IUserSupportService
{
    Task<UserSupportTicket> CreateAsync(CreateSupportTicketRequest request, CancellationToken cancellationToken = default);
    Task<UserSupportTicket?> GetAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserSupportTicket>> ListAsync(Guid tenantId, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<UserSupportTicket> UpdateAsync(Guid id, UpdateSupportTicketRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default);
}

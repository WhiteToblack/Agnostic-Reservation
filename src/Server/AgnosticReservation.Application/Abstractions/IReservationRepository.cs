using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Domain.ValueObjects;

namespace AgnosticReservation.Application.Abstractions;

public interface IReservationRepository : IRepository<Reservation>
{
    Task<bool> HasConflictAsync(Guid tenantId, Guid resourceId, DateRange range, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Reservation>> GetForRangeAsync(Guid tenantId, DateRange range, CancellationToken cancellationToken = default);
}

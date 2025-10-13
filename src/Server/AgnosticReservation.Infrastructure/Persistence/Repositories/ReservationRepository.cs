using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace AgnosticReservation.Infrastructure.Persistence.Repositories;

public class ReservationRepository : RepositoryBase<Reservation>, IReservationRepository
{
    public ReservationRepository(AppDbContext context) : base(context)
    {
    }

    public Task<IReadOnlyList<Reservation>> GetForRangeAsync(Guid tenantId, DateRange range, CancellationToken cancellationToken = default)
        => DbSet.Where(r => r.TenantId == tenantId && r.StartUtc < range.EndUtc && r.EndUtc > range.StartUtc)
            .OrderBy(r => r.StartUtc)
            .ToListAsync(cancellationToken)
            .ContinueWith(t => (IReadOnlyList<Reservation>)t.Result, cancellationToken);

    public async Task<bool> HasConflictAsync(Guid tenantId, Guid resourceId, DateRange range, CancellationToken cancellationToken = default)
        => await DbSet.AnyAsync(r => r.TenantId == tenantId && r.ResourceId == resourceId && r.StartUtc < range.EndUtc && r.EndUtc > range.StartUtc, cancellationToken);
}

using AgnosticReservation.Application.Reservations.Models;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Application.Reservations;

public interface IReservationService
{
    Task<IReadOnlyList<Reservation>> GetAvailabilityAsync(Guid tenantId, Guid resourceId, DateOnly start, DateOnly end, CancellationToken cancellationToken = default);
    Task<Reservation> CreateAsync(CreateReservationRequest request, CancellationToken cancellationToken = default);
    Task CancelAsync(Guid reservationId, Guid tenantId, CancellationToken cancellationToken = default);
}

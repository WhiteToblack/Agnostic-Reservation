using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Notifications;
using AgnosticReservation.Application.Reservations;
using AgnosticReservation.Application.Reservations.Models;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Domain.Enums;
using AgnosticReservation.Domain.ValueObjects;

namespace AgnosticReservation.Infrastructure.Services;

public class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IRepository<Resource> _resourceRepository;
    private readonly INotificationService _notificationService;

    public ReservationService(IReservationRepository reservationRepository, IRepository<Resource> resourceRepository, INotificationService notificationService)
    {
        _reservationRepository = reservationRepository;
        _resourceRepository = resourceRepository;
        _notificationService = notificationService;
    }

    public async Task<IReadOnlyList<Reservation>> GetAvailabilityAsync(Guid tenantId, Guid resourceId, DateOnly start, DateOnly end, CancellationToken cancellationToken = default)
    {
        var range = DateRange.Create(start.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc), end.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc));
        return await _reservationRepository.GetForRangeAsync(tenantId, range, cancellationToken);
    }

    public async Task<Reservation> CreateAsync(CreateReservationRequest request, CancellationToken cancellationToken = default)
    {
        _ = await _resourceRepository.GetAsync(request.ResourceId, cancellationToken) ?? throw new InvalidOperationException("Resource not found");
        var range = DateRange.Create(request.StartUtc, request.EndUtc);
        if (await _reservationRepository.HasConflictAsync(request.TenantId, request.ResourceId, range, cancellationToken))
        {
            throw new InvalidOperationException("Reservation conflict detected");
        }

        var reservation = new Reservation(request.TenantId, request.ResourceId, request.UserId, request.StartUtc, request.EndUtc);
        await _reservationRepository.AddAsync(reservation, cancellationToken);
        await _notificationService.SendAsync(request.TenantId, request.UserId, NotificationChannel.Email, "Reservation Confirmed", $"Reservation #{reservation.Id} confirmed", cancellationToken);
        return reservation;
    }

    public async Task CancelAsync(Guid reservationId, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var reservation = await _reservationRepository.GetAsync(reservationId, cancellationToken) ?? throw new InvalidOperationException("Reservation not found");
        if (reservation.TenantId != tenantId)
        {
            throw new InvalidOperationException("Reservation tenant mismatch");
        }

        reservation.Cancel();
        await _reservationRepository.UpdateAsync(reservation, cancellationToken);
        await _notificationService.SendAsync(tenantId, reservation.UserId, NotificationChannel.Email, "Reservation Cancelled", $"Reservation #{reservation.Id} cancelled", cancellationToken);
    }
}

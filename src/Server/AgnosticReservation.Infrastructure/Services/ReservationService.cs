using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
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

    public async Task<Reservation> UpdateAsync(UpdateReservationRequest request, CancellationToken cancellationToken = default)
    {
        var reservation = await _reservationRepository.GetAsync(request.ReservationId, cancellationToken)
            ?? throw new InvalidOperationException("Reservation not found");

        if (reservation.TenantId != request.TenantId)
        {
            throw new InvalidOperationException("Reservation tenant mismatch");
        }

        if (request.StartUtc.HasValue != request.EndUtc.HasValue)
        {
            throw new InvalidOperationException("Both start and end times must be provided together");
        }

        if (request.StartUtc.HasValue && request.EndUtc.HasValue)
        {
            var range = DateRange.Create(request.StartUtc.Value, request.EndUtc.Value);
            var conflicts = await _reservationRepository.ListAsync(
                r =>
                    r.TenantId == request.TenantId
                    && r.ResourceId == reservation.ResourceId
                    && r.Id != reservation.Id
                    && r.StartUtc < range.EndUtc
                    && r.EndUtc > range.StartUtc,
                cancellationToken);

            if (conflicts.Count > 0)
            {
                throw new InvalidOperationException("Reservation conflict detected");
            }

            reservation.UpdateSchedule(request.StartUtc.Value, request.EndUtc.Value);
        }

        if (request.Status.HasValue)
        {
            reservation.SetStatus(request.Status.Value);
        }

        await _reservationRepository.UpdateAsync(reservation, cancellationToken);
        return reservation;
    }

    public async Task<UserReservationsOverview> GetForUserAsync(Guid tenantId, Guid userId, DateTime? rangeStart, DateTime? rangeEnd, CancellationToken cancellationToken = default)
    {
        var effectiveStart = rangeStart ?? DateTime.UtcNow.AddDays(-30);
        var effectiveEnd = rangeEnd ?? DateTime.UtcNow.AddDays(60);

        if (effectiveEnd <= effectiveStart)
        {
            effectiveEnd = effectiveStart.AddDays(30);
        }

        var range = DateRange.Create(effectiveStart, effectiveEnd);

        var reservations = await _reservationRepository.ListAsync(
            r =>
                r.TenantId == tenantId
                && r.UserId == userId
                && r.StartUtc < range.EndUtc
                && r.EndUtc > range.StartUtc,
            cancellationToken);

        var resourceIds = reservations.Select(r => r.ResourceId).Distinct().ToArray();
        var resources = resourceIds.Length == 0
            ? Array.Empty<Resource>()
            : await _resourceRepository.ListAsync(r => r.TenantId == tenantId && resourceIds.Contains(r.Id), cancellationToken);

        var resourceMap = resources.ToDictionary(r => r.Id, r => r.Name);

        var summaries = reservations
            .OrderByDescending(r => r.StartUtc)
            .Select(r => new ReservationSummaryDto(
                r.Id,
                r.ResourceId,
                resourceMap.TryGetValue(r.ResourceId, out var name) ? name : "Tanımsız Kaynak",
                r.StartUtc,
                r.EndUtc,
                r.Status))
            .ToList();

        var timeline = summaries
            .GroupBy(r => DateOnly.FromDateTime(r.StartUtc.ToUniversalTime()))
            .Select(group => new ReservationTimelinePoint(group.Key, group.Count()))
            .OrderBy(point => point.Date)
            .ToList();

        return new UserReservationsOverview(summaries, timeline);
    }
}

using System;
using System.Collections.Generic;
using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Application.Reservations.Models;

public record ReservationSummaryDto(
    Guid Id,
    Guid ResourceId,
    string ResourceName,
    DateTime StartUtc,
    DateTime EndUtc,
    ReservationStatus Status);

public record ReservationTimelinePoint(DateOnly Date, int Count);

public record UserReservationsOverview(
    IReadOnlyList<ReservationSummaryDto> Reservations,
    IReadOnlyList<ReservationTimelinePoint> Timeline);

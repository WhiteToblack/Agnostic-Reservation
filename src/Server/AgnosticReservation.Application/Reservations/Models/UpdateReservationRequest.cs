using System;
using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Application.Reservations.Models;

public record UpdateReservationRequest(
    Guid ReservationId,
    Guid TenantId,
    DateTime? StartUtc = null,
    DateTime? EndUtc = null,
    ReservationStatus? Status = null);

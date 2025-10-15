using System;

namespace AgnosticReservation.Application.Reservations.Models;

public record CreateReservationRequest(Guid TenantId, Guid ResourceId, Guid UserId, DateTime StartUtc, DateTime EndUtc);

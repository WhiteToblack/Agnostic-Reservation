using System;
using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Domain.Entities;

public class Reservation : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Guid ResourceId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime StartUtc { get; private set; }
    public DateTime EndUtc { get; private set; }
    public ReservationStatus Status { get; private set; }

    private Reservation()
    {
    }

    public Reservation(
        Guid tenantId,
        Guid resourceId,
        Guid userId,
        DateTime startUtc,
        DateTime endUtc,
        ReservationStatus status = ReservationStatus.Confirmed,
        DateTime? createdAt = null)
    {
        if (endUtc <= startUtc)
        {
            throw new ArgumentException("End must be greater than start");
        }

        TenantId = tenantId;
        ResourceId = resourceId;
        UserId = userId;
        StartUtc = startUtc;
        EndUtc = endUtc;
        Status = status;
        CreatedAt = createdAt ?? DateTime.UtcNow;
    }

    public void UpdateSchedule(DateTime startUtc, DateTime endUtc)
    {
        if (endUtc <= startUtc)
        {
            throw new ArgumentException("End must be greater than start");
        }

        StartUtc = startUtc;
        EndUtc = endUtc;
        Touch();
    }

    public void SetStatus(ReservationStatus status)
    {
        Status = status;
        Touch();
    }

    public void Cancel() => SetStatus(ReservationStatus.Cancelled);
}

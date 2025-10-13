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

    public Reservation(Guid tenantId, Guid resourceId, Guid userId, DateTime startUtc, DateTime endUtc)
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
        Status = ReservationStatus.Confirmed;
    }

    public void Cancel() => Status = ReservationStatus.Cancelled;
}

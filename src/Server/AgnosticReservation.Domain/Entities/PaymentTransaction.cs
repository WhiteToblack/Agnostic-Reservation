namespace AgnosticReservation.Domain.Entities;

public class PaymentTransaction : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Guid ReservationId { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; }
    public string Provider { get; private set; }
    public string Status { get; private set; }

    private PaymentTransaction()
    {
        Currency = "USD";
        Provider = string.Empty;
        Status = "Pending";
    }

    public PaymentTransaction(Guid tenantId, Guid reservationId, decimal amount, string currency, string provider)
    {
        TenantId = tenantId;
        ReservationId = reservationId;
        Amount = amount;
        Currency = currency;
        Provider = provider;
        Status = "Pending";
    }

    public void MarkAsPaid() => Status = "Paid";
    public void MarkAsFailed() => Status = "Failed";
}

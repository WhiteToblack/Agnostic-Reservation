using System;

namespace AgnosticReservation.Domain.Entities;

public class PaymentTransaction : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Guid ReservationId { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; }
    public string Provider { get; private set; }
    public string Status { get; private set; }
    public DateTime? ProcessedAt { get; private set; }

    private PaymentTransaction()
    {
        Currency = "USD";
        Provider = string.Empty;
        Status = "Pending";
    }

    public PaymentTransaction(
        Guid tenantId,
        Guid reservationId,
        decimal amount,
        string currency,
        string provider,
        string status = "Pending",
        DateTime? createdAt = null)
    {
        TenantId = tenantId;
        ReservationId = reservationId;
        Amount = amount;
        Currency = currency;
        Provider = provider;
        Status = status;
        CreatedAt = createdAt ?? DateTime.UtcNow;
        if (string.Equals(status, "Paid", StringComparison.OrdinalIgnoreCase))
        {
            ProcessedAt = createdAt ?? DateTime.UtcNow;
        }
    }

    public void MarkAsPaid() => MarkAsPaid(DateTime.UtcNow);

    public void MarkAsPaid(DateTime processedAt)
    {
        Status = "Paid";
        ProcessedAt = processedAt;
        Touch();
    }

    public void MarkAsFailed() => MarkAsFailed(DateTime.UtcNow);

    public void MarkAsFailed(DateTime processedAt)
    {
        Status = "Failed";
        ProcessedAt = processedAt;
        Touch();
    }
}

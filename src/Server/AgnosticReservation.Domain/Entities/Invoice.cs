namespace AgnosticReservation.Domain.Entities;

public class Invoice : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Guid ReservationId { get; private set; }
    public decimal TotalAmount { get; private set; }
    public DateTime InvoiceDate { get; private set; }
    public string Status { get; private set; }

    private Invoice()
    {
        Status = "Draft";
    }

    public Invoice(Guid tenantId, Guid reservationId, decimal totalAmount, DateTime invoiceDate)
    {
        TenantId = tenantId;
        ReservationId = reservationId;
        TotalAmount = totalAmount;
        InvoiceDate = invoiceDate;
        Status = "Draft";
    }

    public void MarkAsIssued() => Status = "Issued";
    public void MarkAsPaid() => Status = "Paid";
}

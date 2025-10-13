namespace AgnosticReservation.Domain.Entities;

public class PurchaseOrder : BaseEntity
{
    public Guid TenantId { get; private set; }
    public string Supplier { get; private set; }
    public decimal TotalAmount { get; private set; }
    public DateTime ExpectedDate { get; private set; }
    public ICollection<PurchaseOrderLine> Lines { get; private set; } = new List<PurchaseOrderLine>();

    private PurchaseOrder()
    {
        Supplier = string.Empty;
    }

    public PurchaseOrder(Guid tenantId, string supplier, decimal totalAmount, DateTime expectedDate)
    {
        TenantId = tenantId;
        Supplier = supplier;
        TotalAmount = totalAmount;
        ExpectedDate = expectedDate;
    }
}

public class PurchaseOrderLine : BaseEntity
{
    public Guid PurchaseOrderId { get; private set; }
    public string Sku { get; private set; }
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }

    private PurchaseOrderLine()
    {
        Sku = string.Empty;
    }

    public PurchaseOrderLine(Guid purchaseOrderId, string sku, int quantity, decimal unitPrice)
    {
        PurchaseOrderId = purchaseOrderId;
        Sku = sku;
        Quantity = quantity;
        UnitPrice = unitPrice;
    }
}

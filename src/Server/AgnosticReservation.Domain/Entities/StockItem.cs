namespace AgnosticReservation.Domain.Entities;

public class StockItem : BaseEntity
{
    public Guid TenantId { get; private set; }
    public string Sku { get; private set; }
    public string Name { get; private set; }
    public int Quantity { get; private set; }
    public int ReorderLevel { get; private set; }

    private StockItem()
    {
        Sku = string.Empty;
        Name = string.Empty;
    }

    public StockItem(Guid tenantId, string sku, string name, int quantity, int reorderLevel)
    {
        TenantId = tenantId;
        Sku = sku;
        Name = name;
        Quantity = quantity;
        ReorderLevel = reorderLevel;
    }

    public void AdjustQuantity(int amount) => Quantity += amount;
}

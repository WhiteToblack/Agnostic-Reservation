namespace AgnosticReservation.Domain.Entities;

public class ServicePackage : BaseEntity
{
    public Guid TenantId { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public decimal Price { get; private set; }
    public int DurationMinutes { get; private set; }

    private ServicePackage()
    {
        Name = string.Empty;
        Description = string.Empty;
    }

    public ServicePackage(Guid tenantId, string name, string description, decimal price, int durationMinutes)
    {
        TenantId = tenantId;
        Name = name;
        Description = description;
        Price = price;
        DurationMinutes = durationMinutes;
    }
}

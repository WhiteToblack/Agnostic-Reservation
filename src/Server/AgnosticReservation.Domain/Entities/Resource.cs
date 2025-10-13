namespace AgnosticReservation.Domain.Entities;

public class Resource : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Tenant Tenant { get; private set; } = default!;
    public string Name { get; private set; }
    public int Capacity { get; private set; }

    private Resource()
    {
        Name = string.Empty;
    }

    public Resource(Guid tenantId, string name, int capacity)
    {
        TenantId = tenantId;
        Name = name;
        Capacity = capacity;
    }
}

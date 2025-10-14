namespace AgnosticReservation.Domain.Entities;

public class TenantParameter : BaseEntity
{
    public Guid TenantId { get; private set; }
    public string Category { get; private set; }
    public string Key { get; private set; }
    public string Value { get; private set; }
    public bool IsSecret { get; private set; }

    private TenantParameter()
    {
        Category = string.Empty;
        Key = string.Empty;
        Value = string.Empty;
    }

    public TenantParameter(Guid tenantId, string category, string key, string value, bool isSecret = false)
    {
        TenantId = tenantId;
        Category = category;
        Key = key;
        Value = value;
        IsSecret = isSecret;
    }

    public void UpdateValue(string value) => Value = value;

    public void UpdateSecret(bool isSecret) => IsSecret = isSecret;
}

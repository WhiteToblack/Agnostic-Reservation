using System.Collections.ObjectModel;

namespace AgnosticReservation.Domain.Entities;

public class LocalizationKey : BaseEntity
{
    public Guid TenantId { get; private set; }
    public string Key { get; private set; }
    public string? Description { get; private set; }
    public ICollection<LocalizationText> Texts { get; private set; } = new Collection<LocalizationText>();

    private LocalizationKey()
    {
        Key = string.Empty;
    }

    public LocalizationKey(Guid tenantId, string key, string? description = null)
    {
        TenantId = tenantId;
        Key = key;
        Description = description;
    }

    public void UpdateDescription(string? description)
    {
        Description = description;
        Touch();
    }
}

public class LocalizationText : BaseEntity
{
    public Guid LocalizationKeyId { get; private set; }
    public LocalizationKey LocalizationKey { get; private set; } = default!;
    public string Language { get; private set; }
    public string Value { get; private set; }

    private LocalizationText()
    {
        Language = string.Empty;
        Value = string.Empty;
    }

    public LocalizationText(Guid localizationKeyId, string language, string value)
    {
        LocalizationKeyId = localizationKeyId;
        Language = language;
        Value = value;
    }

    public void UpdateValue(string value)
    {
        Value = value;
        Touch();
    }
}

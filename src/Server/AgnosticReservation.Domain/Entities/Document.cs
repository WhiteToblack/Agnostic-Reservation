namespace AgnosticReservation.Domain.Entities;

public class Document : BaseEntity
{
    public Guid TenantId { get; private set; }
    public string FileName { get; private set; }
    public string ContentType { get; private set; }
    public long Size { get; private set; }
    public string StoragePath { get; private set; }
    public bool IsPrivate { get; private set; }

    private Document()
    {
        FileName = string.Empty;
        ContentType = string.Empty;
        StoragePath = string.Empty;
    }

    public Document(Guid tenantId, string fileName, string contentType, long size, string storagePath, bool isPrivate)
    {
        TenantId = tenantId;
        FileName = fileName;
        ContentType = contentType;
        Size = size;
        StoragePath = storagePath;
        IsPrivate = isPrivate;
    }
}

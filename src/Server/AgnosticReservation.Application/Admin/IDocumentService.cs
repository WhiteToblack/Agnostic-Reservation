using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Application.Admin;

public interface IDocumentService
{
    Task<Document> UploadAsync(Guid tenantId, string fileName, string contentType, Stream content, bool isPrivate, CancellationToken cancellationToken = default);
    Task<Stream> DownloadAsync(Guid tenantId, Guid documentId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid tenantId, Guid documentId, CancellationToken cancellationToken = default);
}

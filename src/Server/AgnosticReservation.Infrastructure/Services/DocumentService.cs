using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Infrastructure.Services;

public class DocumentService : IDocumentService
{
    private readonly IRepository<Document> _repository;
    private readonly Dictionary<Guid, byte[]> _storage = new();

    public DocumentService(IRepository<Document> repository)
    {
        _repository = repository;
    }

    public async Task<Document> UploadAsync(Guid tenantId, string fileName, string contentType, Stream content, bool isPrivate, CancellationToken cancellationToken = default)
    {
        using var ms = new MemoryStream();
        await content.CopyToAsync(ms, cancellationToken);
        var bytes = ms.ToArray();
        var document = new Document(tenantId, fileName, contentType, bytes.LongLength, $"in-memory://{Guid.NewGuid()}", isPrivate);
        await _repository.AddAsync(document, cancellationToken);
        _storage[document.Id] = bytes;
        return document;
    }

    public Task<Stream> DownloadAsync(Guid tenantId, Guid documentId, CancellationToken cancellationToken = default)
    {
        if (!_storage.TryGetValue(documentId, out var bytes))
        {
            throw new InvalidOperationException("Document not found in storage");
        }

        return Task.FromResult<Stream>(new MemoryStream(bytes, writable: false));
    }

    public async Task DeleteAsync(Guid tenantId, Guid documentId, CancellationToken cancellationToken = default)
    {
        var document = await _repository.GetAsync(documentId, cancellationToken);
        if (document is null || document.TenantId != tenantId)
        {
            throw new InvalidOperationException("Document not found");
        }

        await _repository.DeleteAsync(document, cancellationToken);
        _storage.Remove(documentId);
    }
}

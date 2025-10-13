using AgnosticReservation.Application.Admin;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpPost]
    public async Task<ActionResult> Upload([FromQuery] Guid tenantId, [FromQuery] bool isPrivate, IFormFile file, CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        var document = await _documentService.UploadAsync(tenantId, file.FileName, file.ContentType, stream, isPrivate, cancellationToken);
        return CreatedAtAction(nameof(Download), new { document.Id, tenantId }, document);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Download(Guid id, [FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        var stream = await _documentService.DownloadAsync(tenantId, id, cancellationToken);
        return File(stream, "application/octet-stream");
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        await _documentService.DeleteAsync(tenantId, id, cancellationToken);
        return NoContent();
    }
}

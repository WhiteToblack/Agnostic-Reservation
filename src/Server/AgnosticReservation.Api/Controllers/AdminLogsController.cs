using AgnosticReservation.Application.Logging;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/admin/logs")]
public class AdminLogsController : ControllerBase
{
    private const int DefaultPageSize = 50;
    private const int MaxPageSize = 200;
    private readonly IRequestLogReader _logReader;

    public AdminLogsController(IRequestLogReader logReader)
    {
        _logReader = logReader;
    }

    [HttpGet]
    public async Task<ActionResult<RequestLogPageResponse>> GetAsync([FromQuery] RequestLogQueryRequest request, CancellationToken cancellationToken)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? DefaultPageSize : request.PageSize;
        pageSize = Math.Min(pageSize, MaxPageSize);

        var query = new RequestLogQuery(
            request.TenantId,
            request.ErrorsOnly,
            page,
            pageSize,
            request.CreatedFrom,
            request.CreatedTo,
            request.User,
            request.SessionId);
        var result = await _logReader.QueryAsync(query, cancellationToken).ConfigureAwait(false);

        var response = new RequestLogPageResponse
        {
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount,
            Items = result.Items.Select(item => new RequestLogItemResponse
            {
                Id = item.Id,
                TenantId = item.TenantId,
                UserId = item.UserId,
                UserEmail = item.UserEmail,
                UserName = item.UserName,
                Method = item.Method,
                Path = item.Path,
                Query = item.Query,
                StatusCode = item.StatusCode,
                DurationMilliseconds = item.DurationMilliseconds,
                Headers = new Dictionary<string, string?>(item.Headers),
                IsAccountingOperation = item.IsAccountingOperation,
                CorrelationId = item.CorrelationId,
                EndpointDisplayName = item.EndpointDisplayName,
                UiComponent = item.UiComponent,
                HasError = item.HasError,
                ErrorType = item.ErrorType,
                ErrorMessage = item.ErrorMessage,
                StackTrace = item.StackTrace,
                CreatedAt = item.CreatedAt,
                ErrorAt = item.ErrorAt
            }).ToList()
        };

        return Ok(response);
    }

    public sealed class RequestLogQueryRequest
    {
        public Guid? TenantId { get; set; }
        public bool? ErrorsOnly { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = DefaultPageSize;
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public string? User { get; set; }
        public string? SessionId { get; set; }
    }

    public sealed class RequestLogPageResponse
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public long TotalCount { get; set; }
        public IReadOnlyList<RequestLogItemResponse> Items { get; set; } = Array.Empty<RequestLogItemResponse>();
    }

    public sealed class RequestLogItemResponse
    {
        public string Id { get; set; } = string.Empty;
        public Guid? TenantId { get; set; }
        public Guid? UserId { get; set; }
        public string? UserEmail { get; set; }
        public string? UserName { get; set; }
        public string Method { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string? Query { get; set; }
        public int StatusCode { get; set; }
        public long DurationMilliseconds { get; set; }
        public IDictionary<string, string?> Headers { get; set; } = new Dictionary<string, string?>();
        public bool IsAccountingOperation { get; set; }
        public string? CorrelationId { get; set; }
        public string? EndpointDisplayName { get; set; }
        public string? UiComponent { get; set; }
        public bool HasError { get; set; }
        public string? ErrorType { get; set; }
        public string? ErrorMessage { get; set; }
        public string? StackTrace { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ErrorAt { get; set; }
    }
}

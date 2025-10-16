namespace AgnosticReservation.Application.Logging;

public interface IRequestLogService
{
    Task LogAsync(RequestLogContext context, CancellationToken cancellationToken = default);
}

public interface IRequestLogReader
{
    Task<RequestLogPage> QueryAsync(RequestLogQuery query, CancellationToken cancellationToken = default);
}

public record RequestLogContext(
    Guid? TenantId,
    Guid? UserId,
    string? UserEmail,
    string? UserName,
    string Method,
    string Path,
    string? Query,
    int StatusCode,
    long DurationMilliseconds,
    IReadOnlyDictionary<string, string?> Headers,
    bool IsAccountingOperation,
    string? CorrelationId,
    AccountingLogContext? AccountingContext,
    string? EndpointDisplayName,
    string? UiComponent,
    RequestErrorContext? ErrorContext);

public record AccountingLogContext(string OperationKey, string? ReferenceCode);

public record RequestErrorContext(string ExceptionType, string Message, string? StackTrace, DateTime OccurredAt);

public record RequestLogQuery(
    Guid? TenantId,
    bool? ErrorsOnly,
    int Page,
    int PageSize,
    DateTime? CreatedFrom,
    DateTime? CreatedTo,
    string? User,
    string? SessionId);

public record RequestLogPage(IReadOnlyList<RequestLogEntry> Items, long TotalCount, int Page, int PageSize);

public record RequestLogEntry(
    string Id,
    Guid? TenantId,
    Guid? UserId,
    string? UserEmail,
    string? UserName,
    string Method,
    string Path,
    string? Query,
    int StatusCode,
    long DurationMilliseconds,
    IReadOnlyDictionary<string, string?> Headers,
    bool IsAccountingOperation,
    string? CorrelationId,
    string? EndpointDisplayName,
    string? UiComponent,
    bool HasError,
    string? ErrorType,
    string? ErrorMessage,
    string? StackTrace,
    DateTime CreatedAt,
    DateTime? ErrorAt);

namespace AgnosticReservation.Application.Logging;

public interface IRequestLogService
{
    Task LogAsync(RequestLogContext context, CancellationToken cancellationToken = default);
}

public record RequestLogContext(
    Guid? TenantId,
    Guid? UserId,
    string Method,
    string Path,
    string? Query,
    int StatusCode,
    long DurationMilliseconds,
    IReadOnlyDictionary<string, string?> Headers,
    bool IsAccountingOperation,
    string? CorrelationId,
    AccountingLogContext? AccountingContext);

public record AccountingLogContext(string OperationKey, string? ReferenceCode);

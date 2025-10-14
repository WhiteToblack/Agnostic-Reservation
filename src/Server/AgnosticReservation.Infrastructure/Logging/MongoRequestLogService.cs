using System.Collections.Generic;
using System.Linq;
using AgnosticReservation.Application.Logging;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;

namespace AgnosticReservation.Infrastructure.Logging;

public class MongoRequestLogService : IRequestLogService
{
    private readonly IMongoCollection<GeneralRequestLogDocument> _generalLogs;
    private readonly IMongoCollection<AccountingRequestLogDocument> _accountingLogs;
    private readonly ILogger<MongoRequestLogService> _logger;

    public MongoRequestLogService(IOptions<MongoLoggingOptions> options, ILogger<MongoRequestLogService> logger)
    {
        var settings = options.Value ?? new MongoLoggingOptions();
        var client = new MongoClient(settings.ConnectionString);
        var database = client.GetDatabase(settings.DatabaseName);
        _generalLogs = database.GetCollection<GeneralRequestLogDocument>(settings.GeneralCollectionName);
        _accountingLogs = database.GetCollection<AccountingRequestLogDocument>(settings.AccountingCollectionName);
        _logger = logger;
    }

    public async Task LogAsync(RequestLogContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var document = new GeneralRequestLogDocument
            {
                TenantId = context.TenantId,
                UserId = context.UserId,
                Method = context.Method,
                Path = context.Path,
                Query = context.Query,
                StatusCode = context.StatusCode,
                DurationMilliseconds = context.DurationMilliseconds,
                Headers = context.Headers.ToDictionary(pair => pair.Key, pair => pair.Value),
                IsAccountingOperation = context.IsAccountingOperation,
                CorrelationId = context.CorrelationId,
                CreatedAt = DateTime.UtcNow
            };

            await _generalLogs.InsertOneAsync(document, cancellationToken: cancellationToken).ConfigureAwait(false);

            if (context.IsAccountingOperation && context.AccountingContext is not null)
            {
                var accounting = new AccountingRequestLogDocument
                {
                    GeneralLogId = document.Id,
                    TenantId = context.TenantId,
                    UserId = context.UserId,
                    OperationKey = context.AccountingContext.OperationKey,
                    ReferenceCode = context.AccountingContext.ReferenceCode,
                    CreatedAt = document.CreatedAt
                };

                await _accountingLogs.InsertOneAsync(accounting, cancellationToken: cancellationToken).ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (MongoException exception)
        {
            _logger.LogError(exception, "Failed to persist request log to MongoDB.");
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error while persisting request log to MongoDB.");
        }
    }

    private sealed class GeneralRequestLogDocument
    {
        [BsonId]
        public ObjectId Id { get; set; }

        public Guid? TenantId { get; set; }

        public Guid? UserId { get; set; }

        public string Method { get; set; } = string.Empty;

        public string Path { get; set; } = string.Empty;

        public string? Query { get; set; }

        public int StatusCode { get; set; }

        public long DurationMilliseconds { get; set; }

        public IDictionary<string, string?> Headers { get; set; } = new Dictionary<string, string?>();

        public bool IsAccountingOperation { get; set; }

        public string? CorrelationId { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    private sealed class AccountingRequestLogDocument
    {
        [BsonId]
        public ObjectId Id { get; set; }

        public ObjectId GeneralLogId { get; set; }

        public Guid? TenantId { get; set; }

        public Guid? UserId { get; set; }

        public string OperationKey { get; set; } = string.Empty;

        public string? ReferenceCode { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}

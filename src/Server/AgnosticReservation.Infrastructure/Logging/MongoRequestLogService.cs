using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using AgnosticReservation.Application.Logging;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;

namespace AgnosticReservation.Infrastructure.Logging;

public class MongoRequestLogService : IRequestLogService, IRequestLogReader
{
    private readonly IMongoCollection<GeneralRequestLogDocument>? _generalLogs;
    private readonly IMongoCollection<AccountingRequestLogDocument>? _accountingLogs;
    private readonly ILogger<MongoRequestLogService> _logger;
    private readonly bool _isEnabled;

    public MongoRequestLogService(IOptions<MongoLoggingOptions> options, ILogger<MongoRequestLogService> logger)
    {
        _logger = logger;
        var settings = options.Value ?? new MongoLoggingOptions();

        if (!settings.IsEnabled)
        {
            _logger.LogInformation("Mongo request logging is disabled.");
            return;
        }

        if (string.IsNullOrWhiteSpace(settings.ConnectionString) || string.IsNullOrWhiteSpace(settings.DatabaseName))
        {
            _logger.LogWarning("Mongo request logging disabled because the configuration is incomplete.");
            return;
        }

        try
        {
            var mongoUrlBuilder = new MongoUrlBuilder(settings.ConnectionString);

            if (string.IsNullOrWhiteSpace(mongoUrlBuilder.Username) && !string.IsNullOrWhiteSpace(settings.Username))
            {
                mongoUrlBuilder.Username = settings.Username;
            }

            if (string.IsNullOrWhiteSpace(mongoUrlBuilder.Password) && !string.IsNullOrWhiteSpace(settings.Password))
            {
                mongoUrlBuilder.Password = settings.Password;
            }

            if (!string.IsNullOrWhiteSpace(settings.AuthenticationDatabase))
            {
                mongoUrlBuilder.AuthenticationSource = settings.AuthenticationDatabase;
            }

            var clientSettings = MongoClientSettings.FromUrl(mongoUrlBuilder.ToMongoUrl());
            var client = new MongoClient(clientSettings);
            var database = client.GetDatabase(settings.DatabaseName);
            _generalLogs = database.GetCollection<GeneralRequestLogDocument>(settings.GeneralCollectionName);
            _accountingLogs = database.GetCollection<AccountingRequestLogDocument>(settings.AccountingCollectionName);
            _isEnabled = true;
        }
        catch (MongoConfigurationException exception)
        {
            _logger.LogError(exception, "Failed to initialize MongoDB logging due to invalid configuration.");
        }
        catch (MongoException exception)
        {
            _logger.LogError(exception, "Failed to initialize MongoDB logging due to a MongoDB error.");
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error while initializing MongoDB logging.");
        }
    }

    public async Task LogAsync(RequestLogContext context, CancellationToken cancellationToken = default)
    {
        if (!_isEnabled || _generalLogs is null)
        {
            return;
        }

        try
        {
            var document = new GeneralRequestLogDocument
            {
                TenantId = context.TenantId,
                UserId = context.UserId,
                UserEmail = context.UserEmail,
                UserName = context.UserName,
                Method = context.Method,
                Path = context.Path,
                Query = context.Query,
                StatusCode = context.StatusCode,
                DurationMilliseconds = context.DurationMilliseconds,
                Headers = context.Headers.ToDictionary(pair => pair.Key, pair => pair.Value),
                IsAccountingOperation = context.IsAccountingOperation,
                CorrelationId = context.CorrelationId,
                EndpointDisplayName = context.EndpointDisplayName,
                UiComponent = context.UiComponent,
                HasError = context.ErrorContext is not null,
                ErrorType = context.ErrorContext?.ExceptionType,
                ErrorMessage = context.ErrorContext?.Message,
                ErrorStackTrace = context.ErrorContext?.StackTrace,
                ErrorAt = context.ErrorContext?.OccurredAt,
                CreatedAt = DateTime.UtcNow
            };

            await _generalLogs.InsertOneAsync(document, cancellationToken: cancellationToken).ConfigureAwait(false);

            if (context.IsAccountingOperation && context.AccountingContext is not null)
            {
                if (_accountingLogs is null)
                {
                    _logger.LogWarning("Accounting request logging is not configured but an accounting operation was flagged.");
                    return;
                }

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

    public async Task<RequestLogPage> QueryAsync(RequestLogQuery query, CancellationToken cancellationToken = default)
    {
        if (!_isEnabled || _generalLogs is null)
        {
            return new RequestLogPage(Array.Empty<RequestLogEntry>(), 0, query.Page, query.PageSize);
        }

        try
        {
            var filterBuilder = Builders<GeneralRequestLogDocument>.Filter;
            var filters = new List<FilterDefinition<GeneralRequestLogDocument>>();

            if (query.TenantId.HasValue)
            {
                filters.Add(filterBuilder.Eq(document => document.TenantId, query.TenantId));
            }

            if (query.ErrorsOnly.HasValue)
            {
                filters.Add(filterBuilder.Eq(document => document.HasError, query.ErrorsOnly.Value));
            }

            if (query.CreatedFrom.HasValue)
            {
                var from = NormalizeToUtc(query.CreatedFrom.Value);
                filters.Add(filterBuilder.Gte(document => document.CreatedAt, from));
            }

            if (query.CreatedTo.HasValue)
            {
                var to = NormalizeToUtc(query.CreatedTo.Value);
                filters.Add(filterBuilder.Lte(document => document.CreatedAt, to));
            }

            if (!string.IsNullOrWhiteSpace(query.User))
            {
                var pattern = $".*{Regex.Escape(query.User)}.*";
                var regex = new BsonRegularExpression(pattern, "i");
                filters.Add(filterBuilder.Or(
                    filterBuilder.Regex(document => document.UserEmail, regex),
                    filterBuilder.Regex(document => document.UserName, regex)));
            }

            if (!string.IsNullOrWhiteSpace(query.SessionId))
            {
                filters.Add(filterBuilder.Eq(document => document.CorrelationId, query.SessionId));
            }

            var filter = filters.Count > 0
                ? filterBuilder.And(filters)
                : filterBuilder.Empty;

            var total = await _generalLogs.CountDocumentsAsync(filter, cancellationToken: cancellationToken).ConfigureAwait(false);

            if (total == 0)
            {
                return new RequestLogPage(Array.Empty<RequestLogEntry>(), 0, query.Page, query.PageSize);
            }

            var skip = Math.Max(0, (query.Page - 1) * query.PageSize);

            var documents = await _generalLogs
                .Find(filter)
                .SortByDescending(document => document.CreatedAt)
                .Skip(skip)
                .Limit(query.PageSize)
                .ToListAsync(cancellationToken)
                .ConfigureAwait(false);

            var items = documents
                .Select(document => new RequestLogEntry(
                    document.Id.ToString(),
                    document.TenantId,
                    document.UserId,
                    document.UserEmail,
                    document.UserName,
                    document.Method,
                    document.Path,
                    document.Query,
                    document.StatusCode,
                    document.DurationMilliseconds,
                    new Dictionary<string, string?>(document.Headers ?? new Dictionary<string, string?>()),
                    document.IsAccountingOperation,
                    document.CorrelationId,
                    document.EndpointDisplayName,
                    document.UiComponent,
                    document.HasError,
                    document.ErrorType,
                    document.ErrorMessage,
                    document.ErrorStackTrace,
                    document.CreatedAt,
                    document.ErrorAt))
                .ToList();

            return new RequestLogPage(items, total, query.Page, query.PageSize);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Failed to query request logs from MongoDB.");
            return new RequestLogPage(Array.Empty<RequestLogEntry>(), 0, query.Page, query.PageSize);
        }
    }

    private static DateTime NormalizeToUtc(DateTime value)
        => value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };

    private sealed class GeneralRequestLogDocument
    {
        [BsonId]
        public ObjectId Id { get; set; }

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

        public string? ErrorStackTrace { get; set; }

        public DateTime? ErrorAt { get; set; }

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

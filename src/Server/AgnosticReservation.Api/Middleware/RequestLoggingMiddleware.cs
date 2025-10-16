using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Context;
using AgnosticReservation.Application.Logging;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace AgnosticReservation.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public RequestLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IRequestLogService requestLogService, IParameterService parameterService, ISessionContextAccessor sessionContextAccessor)
    {
        var stopwatch = Stopwatch.StartNew();
        var statusCode = StatusCodes.Status200OK;
        Exception? capturedException = null;

        try
        {
            await _next(context);
            statusCode = context.Response.StatusCode;
        }
        catch (Exception exception)
        {
            statusCode = StatusCodes.Status500InternalServerError;
            capturedException = exception;
            throw;
        }
        finally
        {
            stopwatch.Stop();
            await LogAsync(
                context,
                requestLogService,
                parameterService,
                sessionContextAccessor,
                stopwatch.ElapsedMilliseconds,
                statusCode,
                capturedException);
        }
    }

    private static async Task LogAsync(
        HttpContext context,
        IRequestLogService requestLogService,
        IParameterService parameterService,
        ISessionContextAccessor sessionContextAccessor,
        long elapsedMilliseconds,
        int statusCode,
        Exception? exception)
    {
        var session = sessionContextAccessor.Current;
        var tenantId = session.Tenant?.Id;
        var user = session.User;
        var userEmail = user?.Email;
        var userName = user?.FullName;
        var cancellationToken = context.RequestAborted;

        var isAccountingRequest = IsAccountingRequest(context.Request);
        var (generalEnabled, accountingEnabled) = await ResolveLoggingFlagsAsync(tenantId, parameterService, cancellationToken);

        var headers = context.Request.Headers.ToDictionary(kvp => kvp.Key, kvp => (string?)kvp.Value);
        var accountingContext = isAccountingRequest
            ? new AccountingLogContext(context.Request.Path, context.Request.Query.TryGetValue("reference", out var reference) ? reference.ToString() : null)
            : null;

        var forceLog = exception is not null;

        if (!forceLog)
        {
            if ((!isAccountingRequest && !generalEnabled) || (isAccountingRequest && !accountingEnabled))
            {
                return;
            }
        }

        var endpointDisplayName = context.GetEndpoint()?.DisplayName;
        context.Request.Headers.TryGetValue("X-UI-Component", out var uiComponentHeader);
        var uiComponent = uiComponentHeader.ToString();

        RequestErrorContext? errorContext = null;

        if (exception is not null)
        {
            var exceptionType = exception.GetType();
            errorContext = new RequestErrorContext(
                exceptionType.FullName ?? exceptionType.Name,
                exception.Message,
                exception.StackTrace,
                DateTime.UtcNow);
        }

        var logContext = new RequestLogContext(
            tenantId,
            user?.Id,
            userEmail,
            userName,
            context.Request.Method,
            context.Request.Path,
            context.Request.QueryString.HasValue ? context.Request.QueryString.Value : null,
            statusCode,
            elapsedMilliseconds,
            headers,
            isAccountingRequest,
            context.TraceIdentifier,
            accountingContext,
            endpointDisplayName,
            string.IsNullOrWhiteSpace(uiComponent) ? null : uiComponent,
            errorContext);

        await requestLogService.LogAsync(logContext, cancellationToken);
    }

    private static bool IsAccountingRequest(HttpRequest request)
    {
        if (request.Headers.TryGetValue("X-Accounting-Operation", out var headerValue)
            && bool.TryParse(headerValue, out var explicitFlag))
        {
            if (explicitFlag)
            {
                return true;
            }
        }

        return request.Path.HasValue
            && request.Path.Value!.Contains("/accounting", StringComparison.OrdinalIgnoreCase);
    }

    private static async Task<(bool GeneralEnabled, bool AccountingEnabled)> ResolveLoggingFlagsAsync(
        Guid? tenantId,
        IParameterService parameterService,
        CancellationToken cancellationToken)
    {
        if (!tenantId.HasValue)
        {
            return (true, true);
        }

        var parameters = await parameterService.GetAsync(tenantId.Value, TenantParameterKeys.Categories.Logging, cancellationToken);
        var map = parameters.ToDictionary(p => p.Key, p => p.Value, StringComparer.OrdinalIgnoreCase);

        var generalEnabled = TryGetFlag(map, TenantParameterKeys.Logging.EnableGeneral, defaultValue: true);
        var accountingEnabled = TryGetFlag(map, TenantParameterKeys.Logging.EnableAccounting, defaultValue: true);
        return (generalEnabled, accountingEnabled);
    }

    private static bool TryGetFlag(IReadOnlyDictionary<string, string> map, string key, bool defaultValue)
    {
        if (map.TryGetValue(key, out var value) && bool.TryParse(value, out var parsed))
        {
            return parsed;
        }

        return defaultValue;
    }
}

public static class RequestLoggingApplicationBuilderExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder app)
        => app.UseMiddleware<RequestLoggingMiddleware>();
}

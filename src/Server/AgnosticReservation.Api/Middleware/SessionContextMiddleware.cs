using AgnosticReservation.Application.Context;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace AgnosticReservation.Api.Middleware;

public class SessionContextMiddleware
{
    private readonly RequestDelegate _next;

    public SessionContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ISessionContextAccessor accessor)
    {
        try
        {
            await _next(context);
        }
        finally
        {
            accessor.Clear();
        }
    }
}

public static class SessionContextApplicationBuilderExtensions
{
    public static IApplicationBuilder UseSessionContext(this IApplicationBuilder app)
        => app.UseMiddleware<SessionContextMiddleware>();
}

using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Auth;
using AgnosticReservation.Application.Context;
using AgnosticReservation.Application.Logging;
using AgnosticReservation.Application.Dashboard;
using AgnosticReservation.Application.Notifications;
using AgnosticReservation.Application.Reservations;
using AgnosticReservation.Infrastructure.Logging;
using AgnosticReservation.Infrastructure.Persistence.Repositories;
using AgnosticReservation.Infrastructure.Services;
using Microsoft.Extensions.Configuration;

namespace AgnosticReservation.Api.Modules;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAgnosticReservationModules(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped(typeof(IRepository<>), typeof(RepositoryBase<>));
        services.AddScoped<IReservationRepository, ReservationRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IParameterService, ParameterService>();
        services.AddScoped<IParameterApprovalService, ParameterApprovalService>();
        services.AddSingleton<ICacheService, InMemoryCacheService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IReservationService, ReservationService>();
        services.AddScoped<ISessionContextAccessor, SessionContextAccessor>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.Configure<MongoLoggingOptions>(configuration.GetSection("MongoLogging"));
        services.AddSingleton<IRequestLogService, MongoRequestLogService>();

        return services;
    }
}

using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Auth;
using AgnosticReservation.Application.Context;
using AgnosticReservation.Application.Logging;
using AgnosticReservation.Application.Localization;
using AgnosticReservation.Application.Dashboard;
using AgnosticReservation.Application.Notifications;
using AgnosticReservation.Application.Reservations;
using AgnosticReservation.Application.Support;
using AgnosticReservation.Application.Users;
using AgnosticReservation.Infrastructure.Logging;
using AgnosticReservation.Infrastructure.Persistence.Repositories;
using AgnosticReservation.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

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
        services.AddScoped<IUserSupportService, UserSupportService>();
        services.AddScoped<ILocalizationService, LocalizationService>();
        services.AddScoped<ISessionContextAccessor, SessionContextAccessor>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IAdminNavigationService, AdminNavigationService>();
        services.AddScoped<IUserProfileService, UserProfileService>();
        services.Configure<MongoLoggingOptions>(configuration.GetSection("MongoLogging"));
        services.Configure<AgnosticReservation.Application.Auth.SessionOptions>(configuration.GetSection("Session"));
        services.AddSingleton<MongoRequestLogService>();
        services.AddSingleton<IRequestLogService>(provider => provider.GetRequiredService<MongoRequestLogService>());
        services.AddSingleton<IRequestLogReader>(provider => provider.GetRequiredService<MongoRequestLogService>());

        return services;
    }
}

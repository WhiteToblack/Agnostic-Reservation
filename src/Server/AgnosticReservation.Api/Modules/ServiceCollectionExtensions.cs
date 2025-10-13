using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Auth;
using AgnosticReservation.Application.Dashboard;
using AgnosticReservation.Application.Notifications;
using AgnosticReservation.Application.Reservations;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Infrastructure.Persistence;
using AgnosticReservation.Infrastructure.Persistence.Repositories;
using AgnosticReservation.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace AgnosticReservation.Api.Modules;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAgnosticReservationModules(this IServiceCollection services)
    {
        services.AddScoped(typeof(IRepository<>), typeof(RepositoryBase<>));
        services.AddScoped<IReservationRepository, ReservationRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IParameterService, ParameterService>();
        services.AddSingleton<ICacheService, InMemoryCacheService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IReservationService, ReservationService>();
        services.AddScoped<IDashboardService, DashboardService>();

        services.AddHealthChecks().AddDbContextCheck<AppDbContext>();

        return services;
    }
}

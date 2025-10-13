using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;

namespace AgnosticReservation.Infrastructure.Persistence;

public static class PersistenceServiceCollectionExtensions
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddOptions<DatabaseOptions>()
            .Bind(configuration.GetSection(DatabaseOptions.SectionName));

        services.AddDbContext<AppDbContext>((serviceProvider, options) =>
        {
            var dbOptions = serviceProvider.GetRequiredService<IOptions<DatabaseOptions>>().Value;
            var connectionString = ResolveConnectionString(dbOptions, configuration);

            if (ShouldUseInMemory(dbOptions.Provider, connectionString))
            {
                options.UseInMemoryDatabase(DatabaseOptions.InMemoryDatabaseName);
                return;
            }

            options.UseSqlServer(
                connectionString!,
                sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                    sqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                });

            if (dbOptions.EnableSensitiveLogging)
            {
                options.EnableSensitiveDataLogging();
            }
        });

        services.AddHealthChecks().AddDbContextCheck<AppDbContext>();

        return services;
    }

    private static string? ResolveConnectionString(DatabaseOptions dbOptions, IConfiguration configuration)
    {
        if (!string.IsNullOrWhiteSpace(dbOptions.ConnectionString))
        {
            return dbOptions.ConnectionString;
        }

        return configuration.GetConnectionString("DefaultConnection");
    }

    private static bool ShouldUseInMemory(string provider, string? connectionString)
    {
        if (string.Equals(provider, "InMemory", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.IsNullOrWhiteSpace(connectionString);
    }
}

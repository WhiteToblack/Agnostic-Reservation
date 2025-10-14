using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace AgnosticReservation.Infrastructure.Persistence;

public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();

        var databaseSection = configuration.GetSection(DatabaseOptions.SectionName);
        var provider = databaseSection["Provider"] ?? "SqlServer";
        var connectionString = databaseSection["ConnectionString"];

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

        if (ShouldUseInMemory(provider, connectionString))
        {
            optionsBuilder.UseInMemoryDatabase(DatabaseOptions.InMemoryDatabaseName);
        }
        else
        {
            optionsBuilder.UseSqlServer(
                connectionString!,
                sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                    sqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                });
        }

        if (bool.TryParse(databaseSection["EnableSensitiveLogging"], out var enableSensitiveLogging) && enableSensitiveLogging)
        {
            optionsBuilder.EnableSensitiveDataLogging();
        }

        return new AppDbContext(optionsBuilder.Options);
    }

    private static IConfiguration BuildConfiguration()
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";

        var infrastructureDirectory = Directory.GetCurrentDirectory();
        var apiProjectDirectory = FindApiProjectDirectory(infrastructureDirectory)
            ?? throw new InvalidOperationException("Unable to locate the API project directory when creating the design-time DbContext.");

        return new ConfigurationBuilder()
            .SetBasePath(apiProjectDirectory)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();
    }

    private static string? FindApiProjectDirectory(string startDirectory)
    {
        var directory = new DirectoryInfo(startDirectory);

        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, "AgnosticReservation.Api");

            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        return null;
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

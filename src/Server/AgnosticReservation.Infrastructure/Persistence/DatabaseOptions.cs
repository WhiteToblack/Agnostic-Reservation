namespace AgnosticReservation.Infrastructure.Persistence;

/// <summary>
///     Options that control how the <see cref="AppDbContext"/> connects to a backing store.
///     The options can be bound from the <c>Database</c> configuration section or provided through environment variables.
/// </summary>
public sealed record DatabaseOptions
{
    public const string SectionName = "Database";
    public const string InMemoryDatabaseName = "agnostic-reservation";

    /// <summary>
    ///     The provider identifier. Supported values are <c>SqlServer</c> and <c>InMemory</c>.
    /// </summary>
    public string Provider { get; init; } = "SqlServer";

    /// <summary>
    ///     Connection string used by the SQL Server provider. When omitted the application falls back to
    ///     <see cref="Microsoft.EntityFrameworkCore.InMemoryDbContextOptionsExtensions.UseInMemoryDatabase"/>.
    /// </summary>
    public string? ConnectionString { get; init; }

    /// <summary>
    ///     Enables EF Core sensitive data logging to help troubleshoot data issues when developing locally.
    /// </summary>
    public bool EnableSensitiveLogging { get; init; }
}

namespace AgnosticReservation.Infrastructure.Logging;

public class MongoLoggingOptions
{
    public string ConnectionString { get; set; } = "mongodb://localhost:27017";
    public string DatabaseName { get; set; } = "agnostic-reservation";
    public string GeneralCollectionName { get; set; } = "requestLogs";
    public string AccountingCollectionName { get; set; } = "accountingLogs";
}

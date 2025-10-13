using AgnosticReservation.Application.Notifications;
using AgnosticReservation.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace AgnosticReservation.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ILogger<NotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(Guid tenantId, Guid userId, NotificationChannel channel, string subject, string message, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Dispatching {Channel} notification to {User} in tenant {Tenant}: {Subject}", channel, userId, tenantId, subject);
        // Adapter integration (FCM/SMTP/SMS) can be injected here via strategy pattern.
        return Task.CompletedTask;
    }
}

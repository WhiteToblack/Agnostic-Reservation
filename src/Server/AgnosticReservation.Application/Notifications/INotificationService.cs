using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Application.Notifications;

public interface INotificationService
{
    Task SendAsync(Guid tenantId, Guid userId, NotificationChannel channel, string subject, string message, CancellationToken cancellationToken = default);
}

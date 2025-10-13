using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Domain.Entities;

public class NotificationPreference : BaseEntity
{
    public Guid UserId { get; private set; }
    public bool PushEnabled { get; private set; }
    public bool EmailEnabled { get; private set; }
    public bool SmsEnabled { get; private set; }
    public NotificationChannel PreferredChannel { get; private set; }

    private NotificationPreference()
    {
    }

    public NotificationPreference(Guid userId, bool push, bool email, bool sms, NotificationChannel preferred)
    {
        UserId = userId;
        PushEnabled = push;
        EmailEnabled = email;
        SmsEnabled = sms;
        PreferredChannel = preferred;
    }

    public void Update(bool push, bool email, bool sms, NotificationChannel preferred)
    {
        PushEnabled = push;
        EmailEnabled = email;
        SmsEnabled = sms;
        PreferredChannel = preferred;
    }
}

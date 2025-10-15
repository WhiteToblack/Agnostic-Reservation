namespace AgnosticReservation.Domain.Entities;

public class UserSupportTicket : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Guid UserId { get; private set; }
    public string Subject { get; private set; }
    public string? Summary { get; private set; }
    public string Status { get; private set; }
    public string Channel { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private UserSupportTicket()
    {
        Subject = string.Empty;
        Status = string.Empty;
        Channel = string.Empty;
        CreatedAt = DateTime.UtcNow;
    }

    public UserSupportTicket(Guid tenantId, Guid userId, string subject, string? summary, string status, string channel)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("TenantId is required", nameof(tenantId));
        }

        if (userId == Guid.Empty)
        {
            throw new ArgumentException("UserId is required", nameof(userId));
        }

        if (string.IsNullOrWhiteSpace(subject))
        {
            throw new ArgumentException("Subject is required", nameof(subject));
        }

        if (string.IsNullOrWhiteSpace(status))
        {
            throw new ArgumentException("Status is required", nameof(status));
        }

        if (string.IsNullOrWhiteSpace(channel))
        {
            throw new ArgumentException("Channel is required", nameof(channel));
        }

        TenantId = tenantId;
        UserId = userId;
        Subject = subject.Trim();
        Summary = summary?.Trim();
        Status = status.Trim();
        Channel = channel.Trim();
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateSubject(string subject)
    {
        if (string.IsNullOrWhiteSpace(subject))
        {
            throw new ArgumentException("Subject is required", nameof(subject));
        }

        if (!string.Equals(Subject, subject, StringComparison.Ordinal))
        {
            Subject = subject.Trim();
            Touch();
        }
    }

    public void UpdateSummary(string? summary)
    {
        if (!string.Equals(Summary, summary, StringComparison.Ordinal))
        {
            Summary = summary?.Trim();
            Touch();
        }
    }

    public void UpdateStatus(string status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            throw new ArgumentException("Status is required", nameof(status));
        }

        if (!string.Equals(Status, status, StringComparison.Ordinal))
        {
            Status = status.Trim();
            Touch();
        }
    }

    public void UpdateChannel(string channel)
    {
        if (string.IsNullOrWhiteSpace(channel))
        {
            throw new ArgumentException("Channel is required", nameof(channel));
        }

        if (!string.Equals(Channel, channel, StringComparison.Ordinal))
        {
            Channel = channel.Trim();
            Touch();
        }
    }

    private void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

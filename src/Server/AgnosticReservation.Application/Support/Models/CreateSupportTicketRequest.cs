namespace AgnosticReservation.Application.Support.Models;

public record CreateSupportTicketRequest(
    Guid TenantId,
    Guid UserId,
    string Subject,
    string? Summary,
    string Status,
    string Channel
);

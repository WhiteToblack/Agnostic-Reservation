namespace AgnosticReservation.Application.Support.Models;

public record UpdateSupportTicketRequest(
    Guid TenantId,
    string? Subject,
    string? Summary,
    string? Status,
    string? Channel
);

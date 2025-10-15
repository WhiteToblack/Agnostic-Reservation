using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Support;
using AgnosticReservation.Application.Support.Models;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Infrastructure.Services;

public class UserSupportService : IUserSupportService
{
    private readonly IRepository<UserSupportTicket> _repository;

    public UserSupportService(IRepository<UserSupportTicket> repository)
    {
        _repository = repository;
    }

    public async Task<UserSupportTicket> CreateAsync(CreateSupportTicketRequest request, CancellationToken cancellationToken = default)
    {
        var ticket = new UserSupportTicket(
            request.TenantId,
            request.UserId,
            request.Subject,
            request.Summary,
            request.Status,
            request.Channel);

        await _repository.AddAsync(ticket, cancellationToken);
        return ticket;
    }

    public async Task<UserSupportTicket?> GetAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var ticket = await _repository.GetAsync(id, cancellationToken);
        if (ticket is null || ticket.TenantId != tenantId)
        {
            return null;
        }

        return ticket;
    }

    public async Task<IReadOnlyList<UserSupportTicket>> ListAsync(Guid tenantId, Guid? userId = null, CancellationToken cancellationToken = default)
    {
        return await _repository.ListAsync(
            ticket => ticket.TenantId == tenantId && (!userId.HasValue || ticket.UserId == userId.Value),
            cancellationToken);
    }

    public async Task<UserSupportTicket> UpdateAsync(Guid id, UpdateSupportTicketRequest request, CancellationToken cancellationToken = default)
    {
        var ticket = await _repository.GetAsync(id, cancellationToken) ?? throw new InvalidOperationException("Support ticket not found");
        if (ticket.TenantId != request.TenantId)
        {
            throw new InvalidOperationException("Support ticket tenant mismatch");
        }

        if (!string.IsNullOrWhiteSpace(request.Subject))
        {
            ticket.UpdateSubject(request.Subject);
        }

        if (request.Summary is not null)
        {
            ticket.UpdateSummary(request.Summary);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            ticket.UpdateStatus(request.Status);
        }

        if (!string.IsNullOrWhiteSpace(request.Channel))
        {
            ticket.UpdateChannel(request.Channel);
        }

        await _repository.UpdateAsync(ticket, cancellationToken);
        return ticket;
    }

    public async Task DeleteAsync(Guid id, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var ticket = await _repository.GetAsync(id, cancellationToken) ?? throw new InvalidOperationException("Support ticket not found");
        if (ticket.TenantId != tenantId)
        {
            throw new InvalidOperationException("Support ticket tenant mismatch");
        }

        await _repository.DeleteAsync(ticket, cancellationToken);
    }
}

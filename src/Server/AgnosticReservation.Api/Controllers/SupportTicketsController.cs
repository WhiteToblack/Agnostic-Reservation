using System.Linq;
using AgnosticReservation.Application.Support;
using AgnosticReservation.Application.Support.Models;
using AgnosticReservation.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/support-tickets")]
public class SupportTicketsController : ControllerBase
{
    private static readonly string DefaultStatus = "Alındı";
    private static readonly string DefaultChannel = "Portal";
    private readonly IUserSupportService _supportService;

    public SupportTicketsController(IUserSupportService supportService)
    {
        _supportService = supportService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SupportTicketResponse>>> GetList(
        [FromQuery] Guid tenantId,
        [FromQuery] Guid? userId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
        {
            return BadRequest("TenantId is required");
        }

        var tickets = await _supportService.ListAsync(tenantId, userId, cancellationToken);
        return Ok(tickets.Select(Map));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SupportTicketResponse>> Get(Guid id, [FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
        {
            return BadRequest("TenantId is required");
        }

        var ticket = await _supportService.GetAsync(id, tenantId, cancellationToken);
        if (ticket is null)
        {
            return NotFound();
        }

        return Ok(Map(ticket));
    }

    [HttpPost]
    public async Task<ActionResult<SupportTicketResponse>> Create([FromBody] CreateSupportTicketRequestDto request, CancellationToken cancellationToken)
    {
        if (request.TenantId == Guid.Empty || request.UserId == Guid.Empty)
        {
            return BadRequest("TenantId and UserId are required");
        }

        var status = string.IsNullOrWhiteSpace(request.Status) ? DefaultStatus : request.Status!;
        var channel = string.IsNullOrWhiteSpace(request.Channel) ? DefaultChannel : request.Channel!;

        var ticket = await _supportService.CreateAsync(
            new CreateSupportTicketRequest(
                request.TenantId,
                request.UserId,
                request.Subject,
                request.Summary,
                status,
                channel),
            cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = ticket.Id, tenantId = ticket.TenantId }, Map(ticket));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SupportTicketResponse>> Update(Guid id, [FromBody] UpdateSupportTicketRequestDto request, CancellationToken cancellationToken)
    {
        if (request.TenantId == Guid.Empty)
        {
            return BadRequest("TenantId is required");
        }

        var ticket = await _supportService.UpdateAsync(
            id,
            new UpdateSupportTicketRequest(
                request.TenantId,
                request.Subject,
                request.Summary,
                request.Status,
                request.Channel),
            cancellationToken);

        return Ok(Map(ticket));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
        {
            return BadRequest("TenantId is required");
        }

        await _supportService.DeleteAsync(id, tenantId, cancellationToken);
        return NoContent();
    }

    private static SupportTicketResponse Map(UserSupportTicket ticket)
        => new(
            ticket.Id,
            ticket.TenantId,
            ticket.UserId,
            ticket.Subject,
            ticket.Summary,
            ticket.Status,
            ticket.Channel,
            ticket.CreatedAt,
            ticket.UpdatedAt);
}

public sealed class CreateSupportTicketRequestDto
{
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? Status { get; set; }
    public string? Channel { get; set; }
}

public sealed class UpdateSupportTicketRequestDto
{
    public Guid TenantId { get; set; }
    public string? Subject { get; set; }
    public string? Summary { get; set; }
    public string? Status { get; set; }
    public string? Channel { get; set; }
}

public sealed record SupportTicketResponse(
    Guid Id,
    Guid TenantId,
    Guid UserId,
    string Subject,
    string? Summary,
    string Status,
    string Channel,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

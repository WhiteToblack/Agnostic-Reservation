using System;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Reservations;
using AgnosticReservation.Application.Reservations.Models;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/reservations")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _service;

    public ReservationsController(IReservationService service)
    {
        _service = service;
    }

    [HttpGet("availability")]
    public async Task<ActionResult> GetAvailability([FromQuery] Guid tenantId, [FromQuery] Guid resourceId, [FromQuery] DateOnly start, [FromQuery] DateOnly end, CancellationToken cancellationToken)
    {
        var reservations = await _service.GetAvailabilityAsync(tenantId, resourceId, start, end, cancellationToken);
        return Ok(reservations);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateReservationRequest request, CancellationToken cancellationToken)
    {
        var reservation = await _service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetAvailability), new { request.TenantId, request.ResourceId }, reservation);
    }

    [HttpGet("user")]
    public async Task<ActionResult<UserReservationsOverview>> GetForUser([FromQuery] Guid tenantId, [FromQuery] Guid userId, [FromQuery] DateTime? startUtc, [FromQuery] DateTime? endUtc, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty || userId == Guid.Empty)
        {
            return BadRequest("TenantId and UserId are required");
        }

        var reservations = await _service.GetForUserAsync(tenantId, userId, startUtc, endUtc, cancellationToken);
        return Ok(reservations);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateReservationRequest request, CancellationToken cancellationToken)
    {
        var normalizedRequest = request with { ReservationId = id };
        var reservation = await _service.UpdateAsync(normalizedRequest, cancellationToken);
        return Ok(reservation);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Cancel(Guid id, [FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        await _service.CancelAsync(id, tenantId, cancellationToken);
        return NoContent();
    }
}

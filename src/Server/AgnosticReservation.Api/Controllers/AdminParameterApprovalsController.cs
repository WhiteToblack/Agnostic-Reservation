using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Context;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/admin/parameter-approvals")]
public class AdminParameterApprovalsController : ControllerBase
{
    private readonly IParameterApprovalService _approvalService;
    private readonly ISessionContextAccessor _sessionContextAccessor;

    public AdminParameterApprovalsController(IParameterApprovalService approvalService, ISessionContextAccessor sessionContextAccessor)
    {
        _approvalService = approvalService;
        _sessionContextAccessor = sessionContextAccessor;
    }

    [HttpGet]
    public async Task<ActionResult> GetPending([FromQuery] Guid tenantId, CancellationToken cancellationToken)
    {
        var pending = await _approvalService.GetPendingAsync(tenantId, cancellationToken);
        return Ok(pending);
    }

    [HttpPost("{requestId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid requestId, CancellationToken cancellationToken)
    {
        var session = _sessionContextAccessor.Current;
        var user = session.User ?? throw new InvalidOperationException("Aktif kullanıcı bilgisi bulunamadı");
        await _approvalService.ApproveAsync(requestId, user.Id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{requestId:guid}/reject")]
    public async Task<IActionResult> Reject(Guid requestId, [FromBody] ParameterApprovalDecision? decision, CancellationToken cancellationToken)
    {
        var session = _sessionContextAccessor.Current;
        var user = session.User ?? throw new InvalidOperationException("Aktif kullanıcı bilgisi bulunamadı");
        await _approvalService.RejectAsync(requestId, user.Id, decision?.Reason, cancellationToken);
        return NoContent();
    }
}

public record ParameterApprovalDecision(string? Reason);

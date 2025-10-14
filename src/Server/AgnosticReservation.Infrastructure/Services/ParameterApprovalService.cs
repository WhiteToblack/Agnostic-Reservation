using System.Collections.Generic;
using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Infrastructure.Services;

public class ParameterApprovalService : IParameterApprovalService
{
    private readonly IRepository<TenantParameterChangeRequest> _changeRequestRepository;
    private readonly IRepository<TenantParameter> _parameterRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly ICacheService _cacheService;

    public ParameterApprovalService(
        IRepository<TenantParameterChangeRequest> changeRequestRepository,
        IRepository<TenantParameter> parameterRepository,
        IRepository<User> userRepository,
        IRepository<Role> roleRepository,
        ICacheService cacheService)
    {
        _changeRequestRepository = changeRequestRepository;
        _parameterRepository = parameterRepository;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _cacheService = cacheService;
    }

    public async Task<IReadOnlyList<TenantParameterChangeRequest>> GetPendingAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => await _changeRequestRepository.ListAsync(r => r.TenantId == tenantId && r.Status == ParameterApprovalStatus.Pending, cancellationToken);

    public async Task ApproveAsync(Guid requestId, Guid approverId, CancellationToken cancellationToken = default)
    {
        var request = await _changeRequestRepository.GetAsync(requestId, cancellationToken) ?? throw new InvalidOperationException("Approval request not found");
        if (request.Status != ParameterApprovalStatus.Pending)
        {
            throw new InvalidOperationException("Only pending requests can be approved");
        }

        var requester = await _userRepository.GetAsync(request.RequestedBy, cancellationToken) ?? throw new InvalidOperationException("Requester not found");
        var approver = await _userRepository.GetAsync(approverId, cancellationToken) ?? throw new InvalidOperationException("Approver not found");

        var requesterRole = await _roleRepository.GetAsync(requester.RoleId, cancellationToken) ?? requester.Role;
        var approverRole = await _roleRepository.GetAsync(approver.RoleId, cancellationToken) ?? approver.Role;

        EnsureApproverHasHigherCredentials(approverRole, requesterRole, approverId == requester.Id);

        await ApplyChangeAsync(request, cancellationToken);
        request.Approve(approverId);
        await _changeRequestRepository.UpdateAsync(request, cancellationToken);
        await _cacheService.ClearTenantAsync(request.TenantId, cancellationToken);
    }

    public async Task RejectAsync(Guid requestId, Guid approverId, string? reason, CancellationToken cancellationToken = default)
    {
        var request = await _changeRequestRepository.GetAsync(requestId, cancellationToken) ?? throw new InvalidOperationException("Approval request not found");
        if (request.Status != ParameterApprovalStatus.Pending)
        {
            throw new InvalidOperationException("Only pending requests can be rejected");
        }

        var requester = await _userRepository.GetAsync(request.RequestedBy, cancellationToken) ?? throw new InvalidOperationException("Requester not found");
        var approver = await _userRepository.GetAsync(approverId, cancellationToken) ?? throw new InvalidOperationException("Approver not found");

        var requesterRole = await _roleRepository.GetAsync(requester.RoleId, cancellationToken) ?? requester.Role;
        var approverRole = await _roleRepository.GetAsync(approver.RoleId, cancellationToken) ?? approver.Role;

        EnsureApproverHasHigherCredentials(approverRole, requesterRole, approverId == requester.Id);

        request.Reject(approverId, reason);
        await _changeRequestRepository.UpdateAsync(request, cancellationToken);
    }

    private static void EnsureApproverHasHigherCredentials(Role approverRole, Role requesterRole, bool isSameUser)
    {
        if (approverRole.IsSuperAdmin)
        {
            return;
        }

        if (isSameUser)
        {
            throw new InvalidOperationException("A request cannot be approved by the requester");
        }

        if (approverRole.HierarchyLevel <= requesterRole.HierarchyLevel)
        {
            throw new InvalidOperationException("Approver must have a higher credential level");
        }
    }

    private async Task ApplyChangeAsync(TenantParameterChangeRequest request, CancellationToken cancellationToken)
    {
        switch (request.ChangeType)
        {
            case ParameterChangeType.Create:
                await HandleCreateAsync(request, cancellationToken);
                break;
            case ParameterChangeType.Update:
                await HandleUpdateAsync(request, cancellationToken);
                break;
            case ParameterChangeType.Delete:
                await HandleDeleteAsync(request, cancellationToken);
                break;
            default:
                throw new InvalidOperationException($"Unsupported change type: {request.ChangeType}");
        }
    }

    private async Task HandleCreateAsync(TenantParameterChangeRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ProposedValue))
        {
            throw new InvalidOperationException("Proposed value is required for creation");
        }

        var parameter = new TenantParameter(request.TenantId, request.Category, request.Key, request.ProposedValue, request.IsSecret);
        await _parameterRepository.AddAsync(parameter, cancellationToken);
        request.AttachParameter(parameter.Id);
    }

    private async Task HandleUpdateAsync(TenantParameterChangeRequest request, CancellationToken cancellationToken)
    {
        if (!request.ParameterId.HasValue)
        {
            throw new InvalidOperationException("Parameter id is required for update");
        }

        if (string.IsNullOrWhiteSpace(request.ProposedValue))
        {
            throw new InvalidOperationException("Proposed value is required for update");
        }

        var parameter = await _parameterRepository.GetAsync(request.ParameterId.Value, cancellationToken) ?? throw new InvalidOperationException("Parameter not found");
        parameter.UpdateValue(request.ProposedValue);
        parameter.UpdateSecret(request.IsSecret);
        await _parameterRepository.UpdateAsync(parameter, cancellationToken);
    }

    private async Task HandleDeleteAsync(TenantParameterChangeRequest request, CancellationToken cancellationToken)
    {
        if (!request.ParameterId.HasValue)
        {
            throw new InvalidOperationException("Parameter id is required for deletion");
        }

        var parameter = await _parameterRepository.GetAsync(request.ParameterId.Value, cancellationToken);
        if (parameter is null)
        {
            return;
        }

        await _parameterRepository.DeleteAsync(parameter, cancellationToken);
    }
}

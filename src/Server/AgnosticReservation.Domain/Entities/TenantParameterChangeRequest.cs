using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Domain.Entities;

public class TenantParameterChangeRequest : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Guid? ParameterId { get; private set; }
    public string Category { get; private set; }
    public string Key { get; private set; }
    public string? CurrentValue { get; private set; }
    public string? ProposedValue { get; private set; }
    public bool IsSecret { get; private set; }
    public ParameterChangeType ChangeType { get; private set; }
    public ParameterApprovalStatus Status { get; private set; }
    public Guid RequestedBy { get; private set; }
    public DateTime RequestedAt { get; private set; }
    public Guid? ApprovedBy { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    public string? RejectReason { get; private set; }

    private TenantParameterChangeRequest()
    {
        Category = string.Empty;
        Key = string.Empty;
        Status = ParameterApprovalStatus.Pending;
        RequestedAt = DateTime.UtcNow;
    }

    private TenantParameterChangeRequest(
        Guid tenantId,
        Guid? parameterId,
        string category,
        string key,
        string? currentValue,
        string? proposedValue,
        bool isSecret,
        ParameterChangeType changeType,
        Guid requestedBy)
    {
        TenantId = tenantId;
        ParameterId = parameterId;
        Category = category;
        Key = key;
        CurrentValue = currentValue;
        ProposedValue = proposedValue;
        IsSecret = isSecret;
        ChangeType = changeType;
        Status = ParameterApprovalStatus.Pending;
        RequestedBy = requestedBy;
        RequestedAt = DateTime.UtcNow;
    }

    public static TenantParameterChangeRequest ForCreation(Guid tenantId, string category, string key, string proposedValue, bool isSecret, Guid requestedBy)
        => new(tenantId, null, category, key, null, proposedValue, isSecret, ParameterChangeType.Create, requestedBy);

    public static TenantParameterChangeRequest ForUpdate(Guid tenantId, Guid parameterId, string category, string key, string currentValue, string proposedValue, bool isSecret, Guid requestedBy)
        => new(tenantId, parameterId, category, key, currentValue, proposedValue, isSecret, ParameterChangeType.Update, requestedBy);

    public static TenantParameterChangeRequest ForDeletion(TenantParameter parameter, Guid requestedBy)
        => new(parameter.TenantId, parameter.Id, parameter.Category, parameter.Key, parameter.Value, null, parameter.IsSecret, ParameterChangeType.Delete, requestedBy);

    public void AttachParameter(Guid parameterId)
    {
        ParameterId = parameterId;
    }

    public void Approve(Guid approverId)
    {
        Status = ParameterApprovalStatus.Approved;
        ApprovedBy = approverId;
        ApprovedAt = DateTime.UtcNow;
        RejectReason = null;
    }

    public void Reject(Guid approverId, string? reason)
    {
        Status = ParameterApprovalStatus.Rejected;
        ApprovedBy = approverId;
        ApprovedAt = DateTime.UtcNow;
        RejectReason = reason;
    }
}

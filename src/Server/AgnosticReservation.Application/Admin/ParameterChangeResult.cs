using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Application.Admin;

public record ParameterChangeResult(TenantParameter? Parameter, TenantParameterChangeRequest? PendingRequest, bool RequiresApproval);

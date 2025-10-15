using System;

namespace AgnosticReservation.Application.Auth.Models;

public record SignOutRequest(Guid TenantId, Guid UserId, string DeviceId);

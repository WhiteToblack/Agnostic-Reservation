using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AgnosticReservation.Application.Admin;

public interface IAdminNavigationService
{
    Task<IReadOnlyList<AdminModule>> GetModulesAsync(Guid tenantId, Guid userId, CancellationToken cancellationToken = default);
}

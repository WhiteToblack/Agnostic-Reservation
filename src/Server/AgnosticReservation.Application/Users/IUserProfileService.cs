using System;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Users.Models;

namespace AgnosticReservation.Application.Users;

public interface IUserProfileService
{
    Task<UserProfileDto> GetAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserProfileDto> UpdateAsync(Guid userId, UpdateUserProfileRequest request, CancellationToken cancellationToken = default);
}

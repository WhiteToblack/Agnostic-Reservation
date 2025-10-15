using System;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Users;
using AgnosticReservation.Application.Users.Models;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserProfileService _profileService;

    public UsersController(IUserProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<UserProfileDto>> Get(Guid userId, CancellationToken cancellationToken)
    {
        var profile = await _profileService.GetAsync(userId, cancellationToken);
        return Ok(profile);
    }

    [HttpPut("{userId:guid}")]
    public async Task<ActionResult<UserProfileDto>> Update(Guid userId, [FromBody] UpdateUserProfileRequest request, CancellationToken cancellationToken)
    {
        var profile = await _profileService.UpdateAsync(userId, request, cancellationToken);
        return Ok(profile);
    }
}

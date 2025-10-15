using System;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Auth;
using AgnosticReservation.Application.Auth.Models;
using Microsoft.AspNetCore.Mvc;

namespace AgnosticReservation.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("signin")]
    public async Task<ActionResult<AuthResult>> SignIn([FromBody] SignInRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.SignInAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("signup")]
    public async Task<ActionResult<AuthResult>> SignUp([FromBody] SignUpRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.SignUpAsync(request, cancellationToken);
        return CreatedAtAction(nameof(SignIn), new { request.Email }, result);
    }

    [HttpPost("theme")]
    public async Task<IActionResult> UpdateTheme([FromQuery] Guid userId, [FromBody] string theme, CancellationToken cancellationToken)
    {
        await _authService.RefreshThemeAsync(userId, theme, cancellationToken);
        return NoContent();
    }

    [HttpPost("language")]
    public async Task<IActionResult> UpdateLanguage([FromQuery] Guid userId, [FromBody] string language, CancellationToken cancellationToken)
    {
        await _authService.RefreshLanguageAsync(userId, language, cancellationToken);
        return NoContent();
    }

    [HttpGet("session")]
    public async Task<ActionResult<SessionResume>> GetSession([FromQuery] Guid tenantId, [FromQuery] string deviceId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(deviceId))
        {
            return BadRequest("DeviceId is required");
        }

        var session = await _authService.GetSessionAsync(tenantId, deviceId, cancellationToken);
        if (session is null)
        {
            return NotFound();
        }

        return Ok(session);
    }
}

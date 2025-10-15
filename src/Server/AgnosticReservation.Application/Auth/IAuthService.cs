using System;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Auth.Models;

namespace AgnosticReservation.Application.Auth;

public interface IAuthService
{
    Task<AuthResult> SignInAsync(SignInRequest request, CancellationToken cancellationToken = default);
    Task<AuthResult> SignUpAsync(SignUpRequest request, CancellationToken cancellationToken = default);
    Task RefreshThemeAsync(Guid userId, string preferredTheme, CancellationToken cancellationToken = default);
    Task RefreshLanguageAsync(Guid userId, string preferredLanguage, CancellationToken cancellationToken = default);
    Task<SessionResume?> GetSessionAsync(Guid tenantId, string deviceId, CancellationToken cancellationToken = default);
    Task SignOutAsync(Guid tenantId, Guid userId, string deviceId, CancellationToken cancellationToken = default);
}

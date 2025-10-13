using System.Security.Cryptography;
using System.Text;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Auth;
using AgnosticReservation.Application.Auth.Models;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Tenant> _tenantRepository;
    private readonly IRepository<Role> _roleRepository;

    public AuthService(IRepository<User> userRepository, IRepository<Tenant> tenantRepository, IRepository<Role> roleRepository)
    {
        _userRepository = userRepository;
        _tenantRepository = tenantRepository;
        _roleRepository = roleRepository;
    }

    public async Task<AuthResult> SignInAsync(SignInRequest request, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.ListAsync(u => u.TenantId == request.TenantId && u.Email == request.Email, cancellationToken);
        var user = users.FirstOrDefault();
        if (user is null || user.PasswordHash != HashPassword(request.Password))
        {
            throw new InvalidOperationException("Invalid credentials");
        }

        return new AuthResult(user.Id, user.TenantId, user.Email, GenerateToken(user), GenerateToken(user, isRefresh: true), user.PreferredTheme);
    }

    public async Task<AuthResult> SignUpAsync(SignUpRequest request, CancellationToken cancellationToken = default)
    {
        _ = await _tenantRepository.GetAsync(request.TenantId, cancellationToken) ?? throw new InvalidOperationException("Tenant not found");
        var existing = await _userRepository.ListAsync(u => u.TenantId == request.TenantId && u.Email == request.Email, cancellationToken);
        if (existing.Any())
        {
            throw new InvalidOperationException("User already exists");
        }

        var adminRole = (await _roleRepository.ListAsync(r => r.Name == "Admin", cancellationToken: cancellationToken)).FirstOrDefault()
            ?? new Role("Admin", Enum.GetValues<Permission>());
        var user = new User(request.TenantId, request.Email, HashPassword(request.Password), adminRole, request.PreferredTheme);
        await _userRepository.AddAsync(user, cancellationToken);
        return new AuthResult(user.Id, user.TenantId, user.Email, GenerateToken(user), GenerateToken(user, isRefresh: true), user.PreferredTheme);
    }

    public async Task RefreshThemeAsync(Guid userId, string preferredTheme, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetAsync(userId, cancellationToken) ?? throw new InvalidOperationException("User not found");
        user.UpdateTheme(preferredTheme);
        await _userRepository.UpdateAsync(user, cancellationToken);
    }

    private static string GenerateToken(User user, bool isRefresh = false)
    {
        var payload = $"{user.Id}:{user.TenantId}:{(isRefresh ? "refresh" : "access")}:{DateTime.UtcNow:O}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(payload));
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}

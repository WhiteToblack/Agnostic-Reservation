using System.Security.Cryptography;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Auth;
using AgnosticReservation.Application.Auth.Models;
using AgnosticReservation.Application.Context;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Tenant> _tenantRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IParameterService _parameterService;
    private readonly ISessionContextAccessor _sessionContextAccessor;

    public AuthService(
        IRepository<User> userRepository,
        IRepository<Tenant> tenantRepository,
        IRepository<Role> roleRepository,
        IParameterService parameterService,
        ISessionContextAccessor sessionContextAccessor)
    {
        _userRepository = userRepository;
        _tenantRepository = tenantRepository;
        _roleRepository = roleRepository;
        _parameterService = parameterService;
        _sessionContextAccessor = sessionContextAccessor;
    }

    public async Task<AuthResult> SignInAsync(SignInRequest request, CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.ListAsync(u => u.TenantId == request.TenantId && u.Email == request.Email, cancellationToken);
        var user = users.FirstOrDefault();
        if (user is null || user.PasswordHash != HashPassword(request.Password))
        {
            throw new InvalidOperationException("Invalid credentials");
        }
        var tenant = await _tenantRepository.GetAsync(user.TenantId, cancellationToken) ?? throw new InvalidOperationException("Tenant not found");
        var settings = await GetAuthSettingsAsync(user.TenantId, cancellationToken);
        var role = await _roleRepository.GetAsync(user.RoleId, cancellationToken) ?? user.Role;
        var permissions = role?.Permissions.Select(p => p.Permission).ToArray() ?? Array.Empty<Permission>();
        var shop = await ResolveShopInfoAsync(request.TenantId, request.ShopId, request.ShopName, request.ShopTimeZone, cancellationToken);

        var sessionData = new SessionContextData(
            new SessionUserInfo(user.Id, user.Email, user.FullName, user.PreferredTheme, role?.Name ?? "Unknown", permissions),
            new SessionTenantInfo(tenant.Id, tenant.Name, tenant.Domain, tenant.DefaultTheme),
            shop,
            settings.RequireTwoFactor);

        _sessionContextAccessor.SetSession(sessionData);

        var twoFactorPending = settings.RequireTwoFactor;
        var accessToken = twoFactorPending ? null : GenerateToken(user);
        var refreshToken = twoFactorPending ? null : GenerateToken(user, isRefresh: true);

        return new AuthResult(
            user.Id,
            user.TenantId,
            user.Email,
            accessToken,
            refreshToken,
            user.PreferredTheme,
            twoFactorPending,
            settings,
            sessionData);
    }

    public async Task<AuthResult> SignUpAsync(SignUpRequest request, CancellationToken cancellationToken = default)
    {
        var tenant = await _tenantRepository.GetAsync(request.TenantId, cancellationToken) ?? throw new InvalidOperationException("Tenant not found");
        var settings = await GetAuthSettingsAsync(request.TenantId, cancellationToken);
        if (settings.RequireKvkkAcceptance && !request.AcceptKvkk)
        {
            throw new InvalidOperationException("KVKK metni kabul edilmelidir");
        }
        var existing = await _userRepository.ListAsync(u => u.TenantId == request.TenantId && u.Email == request.Email, cancellationToken);
        if (existing.Any())
        {
            throw new InvalidOperationException("User already exists");
        }

        var adminRole = (await _roleRepository.ListAsync(r => r.Name == "Admin", cancellationToken: cancellationToken)).FirstOrDefault()
            ?? new Role("Admin", Enum.GetValues<Permission>());
        var user = new User(request.TenantId, request.Email, HashPassword(request.Password), adminRole, request.PreferredTheme, request.FullName);
        user.EnableMultiFactor(settings.RequireTwoFactor);
        await _userRepository.AddAsync(user, cancellationToken);

        var permissions = adminRole.Permissions.Select(p => p.Permission).ToArray();
        var shop = await ResolveShopInfoAsync(request.TenantId, request.ShopId, request.ShopName, request.ShopTimeZone, cancellationToken);
        var sessionData = new SessionContextData(
            new SessionUserInfo(user.Id, user.Email, user.FullName, user.PreferredTheme, adminRole.Name, permissions),
            new SessionTenantInfo(tenant.Id, tenant.Name, tenant.Domain, tenant.DefaultTheme),
            shop,
            settings.RequireTwoFactor);

        _sessionContextAccessor.SetSession(sessionData);

        var twoFactorPending = settings.RequireTwoFactor;
        var accessToken = twoFactorPending ? null : GenerateToken(user);
        var refreshToken = twoFactorPending ? null : GenerateToken(user, isRefresh: true);

        return new AuthResult(
            user.Id,
            user.TenantId,
            user.Email,
            accessToken,
            refreshToken,
            user.PreferredTheme,
            twoFactorPending,
            settings,
            sessionData);
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

    private async Task<AuthFeatureSettings> GetAuthSettingsAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var parameters = await _parameterService.GetAsync(tenantId, TenantParameterKeys.Categories.Auth, cancellationToken);
        var map = parameters.ToDictionary(p => p.Key, p => p.Value, StringComparer.OrdinalIgnoreCase);

        var requireKvkk = map.TryGetValue(TenantParameterKeys.Auth.RequireKvkk, out var requireKvkkValue)
            && bool.TryParse(requireKvkkValue, out var kvkkFlag)
            && kvkkFlag;

        var kvkkText = map.TryGetValue(TenantParameterKeys.Auth.KvkkText, out var textValue)
            ? textValue
            : null;

        var requireTwoFactor = map.TryGetValue(TenantParameterKeys.Auth.RequireTwoFactor, out var twoFactorValue)
            && bool.TryParse(twoFactorValue, out var twoFactorFlag)
            && twoFactorFlag;

        var provider = map.TryGetValue(TenantParameterKeys.Auth.TwoFactorProvider, out var providerValue)
            ? providerValue
            : null;

        return new AuthFeatureSettings(requireKvkk, kvkkText, requireTwoFactor, provider);
    }

    private async Task<SessionShopInfo?> ResolveShopInfoAsync(Guid tenantId, Guid? requestShopId, string? requestShopName, string? requestShopTimeZone, CancellationToken cancellationToken)
    {
        if (requestShopId.HasValue)
        {
            return new SessionShopInfo(requestShopId.Value, requestShopName ?? string.Empty, requestShopTimeZone);
        }

        var parameters = await _parameterService.GetAsync(tenantId, TenantParameterKeys.Categories.Shop, cancellationToken);
        var map = parameters.ToDictionary(p => p.Key, p => p.Value, StringComparer.OrdinalIgnoreCase);

        if (!map.TryGetValue(TenantParameterKeys.Shop.DefaultShopId, out var shopIdRaw)
            || !Guid.TryParse(shopIdRaw, out var shopId))
        {
            return null;
        }

        var shopName = map.TryGetValue(TenantParameterKeys.Shop.DefaultShopName, out var name) ? name : requestShopName;
        var timeZone = map.TryGetValue(TenantParameterKeys.Shop.DefaultShopTimeZone, out var zone) ? zone : requestShopTimeZone;

        return new SessionShopInfo(shopId, shopName ?? string.Empty, timeZone);
    }
}

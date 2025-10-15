using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Auth;
using AgnosticReservation.Application.Auth.Models;
using AgnosticReservation.Application.Context;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Domain.Enums;
using Microsoft.Extensions.Options;

namespace AgnosticReservation.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Tenant> _tenantRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IRepository<UserSession> _sessionRepository;
    private readonly IParameterService _parameterService;
    private readonly ISessionContextAccessor _sessionContextAccessor;
    private readonly SessionOptions _sessionOptions;

    public AuthService(
        IRepository<User> userRepository,
        IRepository<Tenant> tenantRepository,
        IRepository<Role> roleRepository,
        IParameterService parameterService,
        ISessionContextAccessor sessionContextAccessor,
        IRepository<UserSession> sessionRepository,
        IOptions<SessionOptions> sessionOptions)
    {
        _userRepository = userRepository;
        _tenantRepository = tenantRepository;
        _roleRepository = roleRepository;
        _parameterService = parameterService;
        _sessionContextAccessor = sessionContextAccessor;
        _sessionRepository = sessionRepository;
        _sessionOptions = sessionOptions.Value;
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

        var sessionData = BuildSessionContext(user, tenant, role, shop, settings.RequireTwoFactor, permissions);

        _sessionContextAccessor.SetSession(sessionData);

        var twoFactorPending = settings.RequireTwoFactor;
        var accessToken = twoFactorPending ? null : GenerateToken(user);
        var refreshToken = twoFactorPending ? null : GenerateToken(user, isRefresh: true);

        var deviceId = NormalizeDeviceId(request.DeviceId);
        await PersistSessionAsync(user, tenant.Id, deviceId, accessToken, refreshToken, cancellationToken);

        return new AuthResult(
            user.Id,
            user.TenantId,
            user.Email,
            accessToken,
            refreshToken,
            user.PreferredTheme,
            user.PreferredLanguage,
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

        var customerRole = await EnsureDefaultCustomerRoleAsync(cancellationToken);
        var user = new User(request.TenantId, request.Email, HashPassword(request.Password), customerRole, request.PreferredTheme, request.FullName, request.PreferredLanguage);
        user.EnableMultiFactor(settings.RequireTwoFactor);
        await _userRepository.AddAsync(user, cancellationToken);

        var permissions = customerRole.Permissions.Select(p => p.Permission).ToArray();
        var shop = await ResolveShopInfoAsync(request.TenantId, request.ShopId, request.ShopName, request.ShopTimeZone, cancellationToken);
        var sessionData = BuildSessionContext(user, tenant, customerRole, shop, settings.RequireTwoFactor, permissions);

        _sessionContextAccessor.SetSession(sessionData);

        var twoFactorPending = settings.RequireTwoFactor;
        var accessToken = twoFactorPending ? null : GenerateToken(user);
        var refreshToken = twoFactorPending ? null : GenerateToken(user, isRefresh: true);

        var deviceId = NormalizeDeviceId(request.DeviceId);
        await PersistSessionAsync(user, tenant.Id, deviceId, accessToken, refreshToken, cancellationToken);

        return new AuthResult(
            user.Id,
            user.TenantId,
            user.Email,
            accessToken,
            refreshToken,
            user.PreferredTheme,
            user.PreferredLanguage,
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

    public async Task RefreshLanguageAsync(Guid userId, string preferredLanguage, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetAsync(userId, cancellationToken) ?? throw new InvalidOperationException("User not found");
        user.UpdateLanguage(preferredLanguage);
        await _userRepository.UpdateAsync(user, cancellationToken);
    }

    public async Task<SessionResume?> GetSessionAsync(Guid tenantId, string deviceId, CancellationToken cancellationToken = default)
    {
        var normalizedDeviceId = NormalizeDeviceId(deviceId);
        var sessions = await _sessionRepository.ListAsync(
            s => s.TenantId == tenantId && s.DeviceId == normalizedDeviceId,
            cancellationToken);

        var expirationThreshold = DateTime.UtcNow - _sessionOptions.IdleTimeout;

        var session = sessions
            .Where(s => s.IsActive && s.LastActivityUtc >= expirationThreshold)
            .OrderByDescending(s => s.LastActivityUtc)
            .FirstOrDefault();

        if (session is null)
        {
            foreach (var stale in sessions.Where(s => s.IsActive && s.LastActivityUtc < expirationThreshold))
            {
                stale.Close();
                await _sessionRepository.UpdateAsync(stale, cancellationToken);
            }

            return null;
        }

        var user = await _userRepository.GetAsync(session.UserId, cancellationToken);
        var tenant = await _tenantRepository.GetAsync(tenantId, cancellationToken);

        if (user is null || tenant is null)
        {
            return null;
        }

        var role = await _roleRepository.GetAsync(user.RoleId, cancellationToken) ?? user.Role;
        var permissions = role?.Permissions.Select(p => p.Permission).ToArray() ?? Array.Empty<Permission>();
        var shop = await ResolveShopInfoAsync(tenantId, null, null, null, cancellationToken);
        var sessionData = BuildSessionContext(user, tenant, role, shop, false, permissions);

        session.TouchSession();
        await _sessionRepository.UpdateAsync(session, cancellationToken);

        return new SessionResume(
            session.Id,
            user.Id,
            tenant.Id,
            user.Email,
            user.FullName,
            user.PreferredTheme,
            user.PreferredLanguage,
            session.LastActivityUtc,
            session.AccessToken,
            session.RefreshToken,
            sessionData);
    }

    public async Task SignOutAsync(Guid tenantId, Guid userId, string deviceId, CancellationToken cancellationToken = default)
    {
        var normalizedDeviceId = NormalizeDeviceId(deviceId);
        var sessions = await _sessionRepository.ListAsync(
            s => s.TenantId == tenantId && s.UserId == userId && s.DeviceId == normalizedDeviceId && s.IsActive,
            cancellationToken);

        foreach (var activeSession in sessions)
        {
            activeSession.Close();
            await _sessionRepository.UpdateAsync(activeSession, cancellationToken);
        }
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

    private static string NormalizeDeviceId(string? deviceId)
        => string.IsNullOrWhiteSpace(deviceId) ? "unknown-device" : deviceId.Trim();

    private async Task PersistSessionAsync(
        User user,
        Guid tenantId,
        string deviceId,
        string? accessToken,
        string? refreshToken,
        CancellationToken cancellationToken)
    {
        var existingSessions = await _sessionRepository.ListAsync(
            s => s.UserId == user.Id && s.TenantId == tenantId && s.DeviceId == deviceId,
            cancellationToken);

        var existing = existingSessions.FirstOrDefault();
        if (existing is null)
        {
            var session = new UserSession(tenantId, user.Id, deviceId, accessToken, refreshToken);
            await _sessionRepository.AddAsync(session, cancellationToken);
            return;
        }

        existing.UpdateTokens(accessToken, refreshToken);
        await _sessionRepository.UpdateAsync(existing, cancellationToken);
    }

    private async Task<Role> EnsureDefaultCustomerRoleAsync(CancellationToken cancellationToken)
    {
        var roles = await _roleRepository.ListAsync(r => r.Name == "Customer", cancellationToken: cancellationToken);
        var role = roles.FirstOrDefault();
        if (role is not null)
        {
            if (!role.Permissions.Any())
            {
                role.Permissions.Add(new RolePermission(role.Id, Permission.ViewDashboard));
                await _roleRepository.UpdateAsync(role, cancellationToken);
            }

            return role;
        }

        role = new Role("Customer", new[] { Permission.ViewDashboard }, hierarchyLevel: 5);
        await _roleRepository.AddAsync(role, cancellationToken);
        return role;
    }

    private static SessionContextData BuildSessionContext(
        User user,
        Tenant tenant,
        Role? role,
        SessionShopInfo? shop,
        bool requireTwoFactor,
        IReadOnlyCollection<Permission> permissions)
    {
        var resolvedRole = role ?? user.Role;
        var resolvedPermissions = permissions.Count > 0
            ? permissions
            : resolvedRole?.Permissions.Select(p => p.Permission).ToArray() ?? Array.Empty<Permission>();

        return new SessionContextData(
            new SessionUserInfo(
                user.Id,
                resolvedRole?.Id ?? Guid.Empty,
                user.Email,
                user.FullName,
                user.PreferredTheme,
                user.PreferredLanguage,
                resolvedRole?.Name ?? "Unknown",
                resolvedRole?.HierarchyLevel ?? 0,
                resolvedRole?.IsSuperAdmin ?? false,
                resolvedPermissions),
            new SessionTenantInfo(tenant.Id, tenant.Name, tenant.Domain, tenant.DefaultTheme),
            shop,
            requireTwoFactor);
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

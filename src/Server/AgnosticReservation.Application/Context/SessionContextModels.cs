using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Application.Context;

public record SessionUserInfo(Guid Id, string Email, string FullName, string PreferredTheme, string Role, IReadOnlyCollection<Permission> Permissions);

public record SessionTenantInfo(Guid Id, string Name, string? Domain, string DefaultTheme);

public record SessionShopInfo(Guid Id, string Name, string? TimeZone);

public record SessionContextData(SessionUserInfo? User, SessionTenantInfo? Tenant, SessionShopInfo? Shop, bool IsTwoFactorRequired);

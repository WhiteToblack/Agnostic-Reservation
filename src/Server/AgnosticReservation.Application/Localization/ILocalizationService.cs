using AgnosticReservation.Application.Localization.Models;

namespace AgnosticReservation.Application.Localization;

public interface ILocalizationService
{
    Task<IReadOnlyList<LocalizationKeyDto>> GetKeysAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<IReadOnlyDictionary<string, string>> GetTranslationsAsync(Guid tenantId, string language, CancellationToken cancellationToken = default);
    Task UpsertAsync(Guid tenantId, LocalizationUpsertRequest request, Guid? userId = null, CancellationToken cancellationToken = default);
    Task RemoveTranslationAsync(Guid tenantId, Guid keyId, string language, CancellationToken cancellationToken = default);
    Task RemoveKeyAsync(Guid tenantId, Guid keyId, CancellationToken cancellationToken = default);
    Task InvalidateCacheAsync(Guid tenantId, CancellationToken cancellationToken = default);
}

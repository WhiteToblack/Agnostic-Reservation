using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Localization;
using AgnosticReservation.Application.Localization.Models;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Infrastructure.Services;

public class LocalizationService : ILocalizationService
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);

    private readonly IRepository<LocalizationKey> _keyRepository;
    private readonly IRepository<LocalizationText> _textRepository;
    private readonly ICacheService _cache;

    public LocalizationService(
        IRepository<LocalizationKey> keyRepository,
        IRepository<LocalizationText> textRepository,
        ICacheService cache)
    {
        _keyRepository = keyRepository;
        _textRepository = textRepository;
        _cache = cache;
    }

    public async Task<IReadOnlyList<LocalizationKeyDto>> GetKeysAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var keys = await _keyRepository.ListAsync(k => k.TenantId == tenantId, cancellationToken);
        if (keys.Count == 0)
        {
            return Array.Empty<LocalizationKeyDto>();
        }

        var keyIds = keys.Select(k => k.Id).ToArray();
        var texts = await _textRepository.ListAsync(t => keyIds.Contains(t.LocalizationKeyId), cancellationToken);
        var grouped = texts
            .GroupBy(t => t.LocalizationKeyId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyDictionary<string, string>)g.ToDictionary(
                    t => t.Language,
                    t => t.Value,
                    StringComparer.OrdinalIgnoreCase),
                EqualityComparer<Guid>.Default);

        return keys
            .Select(k =>
            {
                grouped.TryGetValue(k.Id, out var translations);
                translations ??= new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                return new LocalizationKeyDto(k.Id, k.Key, k.Description, translations);
            })
            .OrderBy(k => k.Key, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task<IReadOnlyDictionary<string, string>> GetTranslationsAsync(Guid tenantId, string language, CancellationToken cancellationToken = default)
    {
        var normalizedLanguage = NormalizeLanguage(language);
        var cacheKey = BuildCacheKey(tenantId, normalizedLanguage);
        var cached = await _cache.GetAsync<IReadOnlyDictionary<string, string>>(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var texts = await _textRepository.ListAsync(
            t => t.LocalizationKey.TenantId == tenantId && t.Language == normalizedLanguage,
            cancellationToken);

        var map = texts.ToDictionary(
            t => t.LocalizationKey.Key,
            t => t.Value,
            StringComparer.OrdinalIgnoreCase);

        await _cache.SetAsync(cacheKey, map, CacheDuration, cancellationToken);
        return map;
    }

    public async Task UpsertAsync(Guid tenantId, LocalizationUpsertRequest request, Guid? userId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Key))
        {
            throw new ArgumentException("Key is required", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.Language))
        {
            throw new ArgumentException("Language is required", nameof(request));
        }

        var normalizedLanguage = NormalizeLanguage(request.Language);
        var keyList = await _keyRepository.ListAsync(
            k => k.TenantId == tenantId && k.Key == request.Key,
            cancellationToken);
        var key = keyList.FirstOrDefault();

        if (key is null)
        {
            key = new LocalizationKey(tenantId, request.Key, request.Description);
            await _keyRepository.AddAsync(key, cancellationToken);
        }
        else if (!string.Equals(key.Description, request.Description, StringComparison.Ordinal))
        {
            key.UpdateDescription(request.Description);
            key.Touch(userId);

            await _keyRepository.UpdateAsync(key, cancellationToken);
        }

        var existingText = (await _textRepository.ListAsync(
            t => t.LocalizationKeyId == key.Id && t.Language == normalizedLanguage,
            cancellationToken)).FirstOrDefault();

        if (existingText is null)
        {
            var text = new LocalizationText(key.Id, normalizedLanguage, request.Value);
            await _textRepository.AddAsync(text, cancellationToken);
        }
        else
        {
            existingText.UpdateValue(request.Value);
            existingText.Touch(userId);

            await _textRepository.UpdateAsync(existingText, cancellationToken);
        }

        await _cache.RemoveAsync(BuildCacheKey(tenantId, normalizedLanguage), cancellationToken);
    }

    public async Task RemoveTranslationAsync(Guid tenantId, Guid keyId, string language, CancellationToken cancellationToken = default)
    {
        var normalizedLanguage = NormalizeLanguage(language);
        var key = await _keyRepository.GetAsync(keyId, cancellationToken);
        if (key is null || key.TenantId != tenantId)
        {
            throw new InvalidOperationException("Localization key not found");
        }

        var text = (await _textRepository.ListAsync(
            t => t.LocalizationKeyId == keyId && t.Language == normalizedLanguage,
            cancellationToken)).FirstOrDefault();

        if (text is null)
        {
            return;
        }

        await _textRepository.DeleteAsync(text, cancellationToken);
        await _cache.RemoveAsync(BuildCacheKey(tenantId, normalizedLanguage), cancellationToken);
    }

    public async Task RemoveKeyAsync(Guid tenantId, Guid keyId, CancellationToken cancellationToken = default)
    {
        var key = await _keyRepository.GetAsync(keyId, cancellationToken);
        if (key is null || key.TenantId != tenantId)
        {
            throw new InvalidOperationException("Localization key not found");
        }

        await _keyRepository.DeleteAsync(key, cancellationToken);
        await _cache.ClearTenantAsync(tenantId, cancellationToken);
    }

    public Task InvalidateCacheAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => _cache.ClearTenantAsync(tenantId, cancellationToken);

    private static string NormalizeLanguage(string language)
    {
        var trimmed = language.Trim();
        if (trimmed.Length == 0)
        {
            return "tr-TR";
        }

        try
        {
            return CultureInfo.GetCultureInfo(trimmed).Name;
        }
        catch (CultureNotFoundException)
        {
            return trimmed.ToLowerInvariant();
        }
    }

    private static string BuildCacheKey(Guid tenantId, string language)
        => $"tenant:{tenantId}:ml:{language.ToLowerInvariant()}";
}

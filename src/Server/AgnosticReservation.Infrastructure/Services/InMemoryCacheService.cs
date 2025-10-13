using System.Collections.Concurrent;
using AgnosticReservation.Application.Admin;

namespace AgnosticReservation.Infrastructure.Services;

public class InMemoryCacheService : ICacheService
{
    private readonly ConcurrentDictionary<string, (DateTimeOffset ExpiresAt, object Value)> _cache = new();

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(key, out var entry) && entry.ExpiresAt > DateTimeOffset.UtcNow)
        {
            return Task.FromResult((T?)entry.Value);
        }

        _cache.TryRemove(key, out _);
        return Task.FromResult(default(T));
    }

    public Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        _cache[key] = (DateTimeOffset.UtcNow.Add(ttl), value!);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        _cache.TryRemove(key, out _);
        return Task.CompletedTask;
    }

    public Task ClearTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var prefix = $"tenant:{tenantId}";
        foreach (var key in _cache.Keys.Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)))
        {
            _cache.TryRemove(key, out _);
        }

        return Task.CompletedTask;
    }
}

using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Infrastructure.Services;

public class ParameterService : IParameterService
{
    private readonly IRepository<TenantParameter> _repository;
    private readonly ICacheService _cache;

    public ParameterService(IRepository<TenantParameter> repository, ICacheService cache)
    {
        _repository = repository;
        _cache = cache;
    }

    public async Task<IReadOnlyList<TenantParameter>> GetAsync(Guid tenantId, string? category = null, CancellationToken cancellationToken = default)
    {
        var cacheKey = BuildCacheKey(tenantId, category);
        var cached = await _cache.GetAsync<IReadOnlyList<TenantParameter>>(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var parameters = await _repository.ListAsync(p => p.TenantId == tenantId && (category == null || p.Category == category), cancellationToken);
        await _cache.SetAsync(cacheKey, parameters, TimeSpan.FromMinutes(10), cancellationToken);
        return parameters;
    }

    public async Task<TenantParameter> UpsertAsync(Guid tenantId, string category, string key, string value, bool isSecret, CancellationToken cancellationToken = default)
    {
        var existing = (await _repository.ListAsync(p => p.TenantId == tenantId && p.Key == key, cancellationToken)).FirstOrDefault();
        if (existing is null)
        {
            existing = new TenantParameter(tenantId, category, key, value, isSecret);
            await _repository.AddAsync(existing, cancellationToken);
        }
        else
        {
            existing.UpdateValue(value);
            await _repository.UpdateAsync(existing, cancellationToken);
        }

        await InvalidateCacheAsync(tenantId, cancellationToken);
        return existing;
    }

    public async Task RemoveAsync(Guid tenantId, Guid parameterId, CancellationToken cancellationToken = default)
    {
        var parameter = await _repository.GetAsync(parameterId, cancellationToken);
        if (parameter is null || parameter.TenantId != tenantId)
        {
            throw new InvalidOperationException("Parameter not found");
        }

        await _repository.DeleteAsync(parameter, cancellationToken);
        await InvalidateCacheAsync(tenantId, cancellationToken);
    }

    public Task InvalidateCacheAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => _cache.ClearTenantAsync(tenantId, cancellationToken);

    private static string BuildCacheKey(Guid tenantId, string? category) => $"tenant:{tenantId}:params:{category ?? "all"}";
}

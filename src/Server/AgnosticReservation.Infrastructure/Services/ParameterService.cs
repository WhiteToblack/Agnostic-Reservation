using System.Linq;
using AgnosticReservation.Application.Admin;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Infrastructure.Services;

public class ParameterService : IParameterService
{
    private readonly IRepository<TenantParameter> _repository;
    private readonly IRepository<TenantParameterChangeRequest> _changeRequestRepository;
    private readonly ICacheService _cache;

    public ParameterService(IRepository<TenantParameter> repository, IRepository<TenantParameterChangeRequest> changeRequestRepository, ICacheService cache)
    {
        _repository = repository;
        _changeRequestRepository = changeRequestRepository;
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

    public async Task<ParameterChangeResult> UpsertAsync(Guid tenantId, string category, string key, string value, bool isSecret, Guid requestedBy, bool bypassApproval, CancellationToken cancellationToken = default)
    {
        var existing = (await _repository.ListAsync(p => p.TenantId == tenantId && p.Key == key, cancellationToken)).FirstOrDefault();
        if (existing is null)
        {
            if (bypassApproval)
            {
                var created = new TenantParameter(tenantId, category, key, value, isSecret);
                await _repository.AddAsync(created, cancellationToken);
                await InvalidateCacheAsync(tenantId, cancellationToken);
                return new ParameterChangeResult(created, null, false);
            }

            var createRequest = TenantParameterChangeRequest.ForCreation(tenantId, category, key, value, isSecret, requestedBy);
            await _changeRequestRepository.AddAsync(createRequest, cancellationToken);
            return new ParameterChangeResult(null, createRequest, true);
        }

        if (existing.Value == value && existing.IsSecret == isSecret)
        {
            return new ParameterChangeResult(existing, null, false);
        }

        if (bypassApproval)
        {
            existing.UpdateValue(value);
            existing.UpdateSecret(isSecret);
            await _repository.UpdateAsync(existing, cancellationToken);
            await InvalidateCacheAsync(tenantId, cancellationToken);
            return new ParameterChangeResult(existing, null, false);
        }

        var updateRequest = TenantParameterChangeRequest.ForUpdate(tenantId, existing.Id, category, key, existing.Value, value, isSecret, requestedBy);
        await _changeRequestRepository.AddAsync(updateRequest, cancellationToken);
        return new ParameterChangeResult(existing, updateRequest, true);
    }

    public async Task<ParameterChangeResult> RemoveAsync(Guid tenantId, Guid parameterId, Guid requestedBy, bool bypassApproval, CancellationToken cancellationToken = default)
    {
        var parameter = await _repository.GetAsync(parameterId, cancellationToken);
        if (parameter is null || parameter.TenantId != tenantId)
        {
            throw new InvalidOperationException("Parameter not found");
        }

        if (bypassApproval)
        {
            await _repository.DeleteAsync(parameter, cancellationToken);
            await InvalidateCacheAsync(tenantId, cancellationToken);
            return new ParameterChangeResult(null, null, false);
        }

        var deleteRequest = TenantParameterChangeRequest.ForDeletion(parameter, requestedBy);
        await _changeRequestRepository.AddAsync(deleteRequest, cancellationToken);
        return new ParameterChangeResult(parameter, deleteRequest, true);
    }

    public Task InvalidateCacheAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => _cache.ClearTenantAsync(tenantId, cancellationToken);

    private static string BuildCacheKey(Guid tenantId, string? category) => $"tenant:{tenantId}:params:{category ?? "all"}";
}

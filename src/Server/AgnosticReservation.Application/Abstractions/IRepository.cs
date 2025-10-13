using System.Linq.Expressions;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Application.Abstractions;

public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> ListAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(T entity, CancellationToken cancellationToken = default);
}

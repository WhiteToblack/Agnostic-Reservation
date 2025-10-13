using System.Linq.Expressions;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AgnosticReservation.Infrastructure.Persistence.Repositories;

public class RepositoryBase<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext DbContext;
    protected readonly DbSet<T> DbSet;

    public RepositoryBase(AppDbContext context)
    {
        DbContext = context;
        DbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetAsync(Guid id, CancellationToken cancellationToken = default)
        => await DbSet.FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

    public virtual async Task<IReadOnlyList<T>> ListAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default)
    {
        IQueryable<T> query = DbSet;
        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        return await query.ToListAsync(cancellationToken);
    }

    public virtual async Task AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await DbSet.AddAsync(entity, cancellationToken);
        await DbContext.SaveChangesAsync(cancellationToken);
    }

    public virtual async Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        DbSet.Update(entity);
        await DbContext.SaveChangesAsync(cancellationToken);
    }

    public virtual async Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        DbSet.Remove(entity);
        await DbContext.SaveChangesAsync(cancellationToken);
    }
}

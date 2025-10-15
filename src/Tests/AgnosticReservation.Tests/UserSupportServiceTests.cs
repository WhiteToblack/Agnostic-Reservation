using AgnosticReservation.Application.Support.Models;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Infrastructure.Persistence;
using AgnosticReservation.Infrastructure.Persistence.Repositories;
using AgnosticReservation.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AgnosticReservation.Tests;

public class UserSupportServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldPersistTicket()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var context = new AppDbContext(options);
        var repository = new RepositoryBase<UserSupportTicket>(context);
        var service = new UserSupportService(repository);

        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var request = new CreateSupportTicketRequest(tenantId, userId, "Ödeme Sorunu", "Ödeme alınamadı", "Alındı", "Portal");

        var ticket = await service.CreateAsync(request);

        Assert.Equal(tenantId, ticket.TenantId);
        Assert.Equal(userId, ticket.UserId);
        Assert.Equal("Ödeme Sorunu", ticket.Subject);
        Assert.Equal("Portal", ticket.Channel);

        var stored = await context.UserSupportTickets.FirstOrDefaultAsync();
        Assert.NotNull(stored);
        Assert.Equal(ticket.Id, stored!.Id);
    }

    [Fact]
    public async Task UpdateAsync_ShouldApplyChanges()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var context = new AppDbContext(options);
        var repository = new RepositoryBase<UserSupportTicket>(context);
        var service = new UserSupportService(repository);

        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var ticket = await service.CreateAsync(new CreateSupportTicketRequest(tenantId, userId, "Geç Check-out", null, "Alındı", "Portal"));

        var updated = await service.UpdateAsync(
            ticket.Id,
            new UpdateSupportTicketRequest(tenantId, "Check-out Uzatıldı", "Müşteri talebi ile güncellendi", "Yanıtlandı", "Telefon"));

        Assert.Equal("Check-out Uzatıldı", updated.Subject);
        Assert.Equal("Müşteri talebi ile güncellendi", updated.Summary);
        Assert.Equal("Yanıtlandı", updated.Status);
        Assert.Equal("Telefon", updated.Channel);
    }

    [Fact]
    public async Task ListAsync_ShouldFilterByUser()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var context = new AppDbContext(options);
        var repository = new RepositoryBase<UserSupportTicket>(context);
        var service = new UserSupportService(repository);

        var tenantId = Guid.NewGuid();
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        await service.CreateAsync(new CreateSupportTicketRequest(tenantId, userA, "A talebi", null, "Alındı", "Portal"));
        await service.CreateAsync(new CreateSupportTicketRequest(tenantId, userB, "B talebi", null, "Alındı", "Portal"));

        var userATickets = await service.ListAsync(tenantId, userA);
        Assert.Single(userATickets);
        Assert.All(userATickets, ticket => Assert.Equal(userA, ticket.UserId));
    }
}

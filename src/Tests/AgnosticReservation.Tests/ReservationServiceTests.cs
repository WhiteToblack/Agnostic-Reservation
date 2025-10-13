using AgnosticReservation.Application.Notifications;
using AgnosticReservation.Application.Reservations.Models;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Infrastructure.Persistence;
using AgnosticReservation.Infrastructure.Persistence.Repositories;
using AgnosticReservation.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace AgnosticReservation.Tests;

public class ReservationServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldThrow_WhenConflictingReservationExists()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        using var context = new AppDbContext(options);
        var repo = new ReservationRepository(context);
        var resourceRepo = new RepositoryBase<Resource>(context);
        var notificationMock = new Mock<INotificationService>();
        var service = new ReservationService(repo, resourceRepo, notificationMock.Object);

        var tenantId = Guid.NewGuid();
        var resource = new Resource(tenantId, "Room A", 10);
        await resourceRepo.AddAsync(resource);
        var userId = Guid.NewGuid();
        var existing = new Reservation(tenantId, resource.Id, userId, DateTime.UtcNow, DateTime.UtcNow.AddHours(1));
        await repo.AddAsync(existing);

        var request = new CreateReservationRequest(tenantId, resource.Id, userId, existing.StartUtc.AddMinutes(30), existing.EndUtc.AddMinutes(30));

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(request));
    }
}

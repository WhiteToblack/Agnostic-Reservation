using System.Threading;
using AgnosticReservation.Application.Notifications;
using AgnosticReservation.Application.Reservations.Models;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Domain.Enums;
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

    [Fact]
    public async Task CancelAsync_ShouldMarkReservationAndNotify()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        using var context = new AppDbContext(options);
        var repo = new ReservationRepository(context);
        var resourceRepo = new RepositoryBase<Resource>(context);
        var notificationMock = new Mock<INotificationService>();
        var service = new ReservationService(repo, resourceRepo, notificationMock.Object);

        var tenantId = Guid.NewGuid();
        var resource = new Resource(tenantId, "Room B", 12);
        await resourceRepo.AddAsync(resource);
        var userId = Guid.NewGuid();
        var reservation = new Reservation(tenantId, resource.Id, userId, DateTime.UtcNow, DateTime.UtcNow.AddHours(2));
        await repo.AddAsync(reservation);

        await service.CancelAsync(reservation.Id, tenantId);

        var stored = await repo.GetAsync(reservation.Id);
        Assert.NotNull(stored);
        Assert.Equal(ReservationStatus.Cancelled, stored!.Status);
        notificationMock.Verify(
            n => n.SendAsync(
                tenantId,
                userId,
                NotificationChannel.Email,
                "Reservation Cancelled",
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()
            ),
            Times.Once
        );
    }
}

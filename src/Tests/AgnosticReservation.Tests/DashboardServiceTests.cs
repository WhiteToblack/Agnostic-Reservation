using System;
using System.Linq;
using AgnosticReservation.Application.Dashboard;
using AgnosticReservation.Domain.Entities;
using AgnosticReservation.Domain.Enums;
using AgnosticReservation.Infrastructure.Persistence;
using AgnosticReservation.Infrastructure.Persistence.Repositories;
using AgnosticReservation.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AgnosticReservation.Tests;

public class DashboardServiceTests
{
    [Fact]
    public async Task GetForUserAsync_ShouldCloneDefaultDashboard()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        using var context = new AppDbContext(options);
        var dashboardRepo = new RepositoryBase<DashboardDefinition>(context);
        var widgetRepo = new RepositoryBase<DashboardWidget>(context);
        var service = new DashboardService(dashboardRepo, widgetRepo, NullLogger<DashboardService>.Instance);

        var tenantId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var defaultDashboard = new DashboardDefinition(tenantId, roleId, null, "{\"theme\":\"light\"}");
        await dashboardRepo.AddAsync(defaultDashboard);
        var defaultWidget = new DashboardWidget(defaultDashboard.Id, WidgetType.KPICard, 1, "{\"title\":\"Revenue\"}");
        await widgetRepo.AddAsync(defaultWidget);

        var userId = Guid.NewGuid();
        var userDashboard = await service.GetForUserAsync(tenantId, roleId, userId);
        var userWidgets = await service.ListWidgetsAsync(userDashboard.Id);

        Assert.Equal(userId, userDashboard.UserId);
        Assert.Equal(defaultDashboard.LayoutConfigJson, userDashboard.LayoutConfigJson);
        Assert.Single(userWidgets);
        var clonedWidget = userWidgets.First();
        Assert.Equal(defaultWidget.WidgetType, clonedWidget.WidgetType);
        Assert.Equal(defaultWidget.Order, clonedWidget.Order);
        Assert.Equal(defaultWidget.ConfigJson, clonedWidget.ConfigJson);
    }

    [Fact]
    public async Task UpdateUserLayoutAsync_ShouldPersistWidgetChanges()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        using var context = new AppDbContext(options);
        var dashboardRepo = new RepositoryBase<DashboardDefinition>(context);
        var widgetRepo = new RepositoryBase<DashboardWidget>(context);
        var service = new DashboardService(dashboardRepo, widgetRepo, NullLogger<DashboardService>.Instance);

        var tenantId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var dashboard = new DashboardDefinition(tenantId, roleId, userId, null);
        await dashboardRepo.AddAsync(dashboard);
        var widget = new DashboardWidget(dashboard.Id, WidgetType.CalendarMini, 1, null);
        await widgetRepo.AddAsync(widget);

        var updates = new[] { new DashboardWidgetUpdateModel(widget.Id, 3, "{\"title\":\"Updated\"}") };
        await service.UpdateUserLayoutAsync(dashboard.Id, "{\"theme\":\"dark\"}", updates);

        var reloadedDashboard = await dashboardRepo.GetAsync(dashboard.Id) ?? throw new InvalidOperationException();
        var reloadedWidget = await widgetRepo.GetAsync(widget.Id) ?? throw new InvalidOperationException();

        Assert.Equal("{\"theme\":\"dark\"}", reloadedDashboard.LayoutConfigJson);
        Assert.Equal(3, reloadedWidget.Order);
        Assert.Equal("{\"title\":\"Updated\"}", reloadedWidget.ConfigJson);
    }
}

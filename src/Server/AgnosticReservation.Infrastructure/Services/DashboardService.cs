using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Dashboard;
using AgnosticReservation.Application.Dashboard.Models;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly IRepository<DashboardDefinition> _dashboardRepository;
    private readonly IRepository<DashboardWidget> _widgetRepository;
    private readonly IReservationRepository _reservationRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Resource> _resourceRepository;
    private readonly IRepository<PaymentTransaction> _paymentRepository;

    public DashboardService(
        IRepository<DashboardDefinition> dashboardRepository,
        IRepository<DashboardWidget> widgetRepository,
        IReservationRepository reservationRepository,
        IRepository<User> userRepository,
        IRepository<Resource> resourceRepository,
        IRepository<PaymentTransaction> paymentRepository)
    {
        _dashboardRepository = dashboardRepository;
        _widgetRepository = widgetRepository;
        _reservationRepository = reservationRepository;
        _userRepository = userRepository;
        _resourceRepository = resourceRepository;
        _paymentRepository = paymentRepository;
    }

    public async Task<DashboardDefinition> GetForRoleAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken = default)
    {
        var dashboards = await _dashboardRepository.ListAsync(d => d.TenantId == tenantId && d.RoleId == roleId, cancellationToken);
        var dashboard = dashboards.FirstOrDefault();
        if (dashboard is null)
        {
            dashboard = new DashboardDefinition(tenantId, roleId);
            await _dashboardRepository.AddAsync(dashboard, cancellationToken);
        }

        return dashboard;
    }

    public Task<IReadOnlyList<DashboardWidget>> ListWidgetsAsync(Guid dashboardId, CancellationToken cancellationToken = default)
        => _widgetRepository.ListAsync(w => w.DashboardDefinitionId == dashboardId, cancellationToken);

    public async Task<DashboardInsights> GetInsightsAsync(Guid tenantId, Guid? userId, CancellationToken cancellationToken = default)
    {
        var reservationsTask = _reservationRepository.ListAsync(r => r.TenantId == tenantId, cancellationToken);
        var usersTask = _userRepository.ListAsync(u => u.TenantId == tenantId, cancellationToken);
        var resourcesTask = _resourceRepository.ListAsync(r => r.TenantId == tenantId, cancellationToken);
        var paymentsTask = _paymentRepository.ListAsync(p => p.TenantId == tenantId, cancellationToken);

        await Task.WhenAll(reservationsTask, usersTask, resourcesTask, paymentsTask);

        var reservations = reservationsTask.Result;
        var users = usersTask.Result.ToDictionary(u => u.Id, u => u);
        var resources = resourcesTask.Result.ToDictionary(r => r.Id, r => r);
        var payments = paymentsTask.Result;

        if (userId.HasValue)
        {
            reservations = reservations.Where(r => r.UserId == userId.Value).ToList();
            payments = payments.Where(p => reservations.Any(r => r.Id == p.ReservationId)).ToList();
        }

        var usageTimeline = BuildUsageTimeline(reservations, resources.Values);
        var revenueTimeline = BuildRevenueTimeline(payments);
        var breakdown = BuildBreakdown(reservations, payments, users, resources);
        var rooms = BuildRoomInsights(reservations, payments, users, resources);

        return new DashboardInsights(
            new UsageInsight(usageTimeline, breakdown.OrderByDescending(row => row.HoursUsed).ToList()),
            new RevenueInsight(revenueTimeline, breakdown.OrderByDescending(row => row.AmountPaid).ToList()),
            rooms);
    }

    private static IReadOnlyList<TimelinePoint> BuildUsageTimeline(IReadOnlyList<Reservation> reservations, ICollection<Resource> resources)
    {
        if (resources.Count == 0)
        {
            return Array.Empty<TimelinePoint>();
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var start = today.AddDays(-6);
        var maxDailyCapacity = resources.Count * 24m;
        var points = new List<TimelinePoint>(7);

        foreach (var offset in Enumerable.Range(0, 7))
        {
            var day = start.AddDays(offset);
            var windowStart = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var windowEnd = day.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            var hours = reservations
                .Where(r => r.StartUtc < windowEnd && r.EndUtc > windowStart)
                .Sum(r => (decimal)GetOverlapHours(r, windowStart, windowEnd));

            var utilization = maxDailyCapacity <= 0 ? 0 : Math.Clamp(hours / maxDailyCapacity * 100m, 0, 100);
            points.Add(new TimelinePoint(day, Math.Round(utilization, 2)));
        }

        return points;
    }

    private static IReadOnlyList<TimelinePoint> BuildRevenueTimeline(IReadOnlyList<PaymentTransaction> payments)
    {
        var paid = payments.Where(IsPaid).ToList();
        if (paid.Count == 0)
        {
            return Array.Empty<TimelinePoint>();
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var start = today.AddDays(-13);
        var points = new List<TimelinePoint>(14);

        foreach (var offset in Enumerable.Range(0, 14))
        {
            var day = start.AddDays(offset);
            var total = paid
                .Where(p => DateOnly.FromDateTime(p.ProcessedAt ?? p.UpdatedAt ?? p.CreatedAt) == day)
                .Sum(p => p.Amount);
            points.Add(new TimelinePoint(day, Math.Round(total, 2)));
        }

        return points;
    }

    private static IReadOnlyList<UtilizationRevenueRow> BuildBreakdown(
        IReadOnlyList<Reservation> reservations,
        IReadOnlyList<PaymentTransaction> payments,
        IReadOnlyDictionary<Guid, User> users,
        IReadOnlyDictionary<Guid, Resource> resources)
    {
        if (reservations.Count == 0)
        {
            return Array.Empty<UtilizationRevenueRow>();
        }

        var paymentLookup = payments
            .Where(IsPaid)
            .GroupBy(p => p.ReservationId)
            .ToDictionary(g => g.Key, g => g.Sum(p => p.Amount));

        var rows = reservations
            .GroupBy(r => new { r.UserId, r.ResourceId })
            .Select(group =>
            {
                var userName = users.TryGetValue(group.Key.UserId, out var user)
                    ? user.FullName
                    : "Bilinmeyen Kullanıcı";
                var resourceName = resources.TryGetValue(group.Key.ResourceId, out var resource)
                    ? resource.Name
                    : "Tanımsız Kaynak";

                var totalHours = group.Sum(r => (r.EndUtc - r.StartUtc).TotalHours);
                var amount = group.Sum(r => paymentLookup.TryGetValue(r.Id, out var value) ? value : 0m);

                return new UtilizationRevenueRow(
                    group.Key.UserId,
                    group.Key.ResourceId,
                    userName,
                    resourceName,
                    Math.Round(totalHours, 2),
                    Math.Round(amount, 2),
                    group.Count());
            })
            .OrderByDescending(row => row.HoursUsed)
            .ToList();

        return rows;
    }

    private static IReadOnlyList<RoomInsight> BuildRoomInsights(
        IReadOnlyList<Reservation> reservations,
        IReadOnlyList<PaymentTransaction> payments,
        IReadOnlyDictionary<Guid, User> users,
        IReadOnlyDictionary<Guid, Resource> resources)
    {
        var paymentLookup = payments
            .Where(IsPaid)
            .GroupBy(p => p.ReservationId)
            .ToDictionary(g => g.Key, g => g.Sum(p => p.Amount));

        var insights = new List<RoomInsight>(resources.Count);

        foreach (var resource in resources.Values.OrderBy(r => r.Name))
        {
            var resourceReservations = reservations
                .Where(r => r.ResourceId == resource.Id)
                .OrderBy(r => r.StartUtc)
                .ToList();

            var occupancy = BuildRoomTimeline(resourceReservations);
            var rows = resourceReservations
                .Select(reservation =>
                {
                    var userName = users.TryGetValue(reservation.UserId, out var user)
                        ? user.FullName
                        : "Bilinmeyen Kullanıcı";
                    var amount = paymentLookup.TryGetValue(reservation.Id, out var value) ? value : 0m;

                    return new RoomReservationRow(
                        reservation.Id,
                        resource.Id,
                        resource.Name,
                        reservation.UserId,
                        userName,
                        reservation.StartUtc,
                        reservation.EndUtc,
                        reservation.Status.ToString(),
                        Math.Round(amount, 2));
                })
                .ToList();

            insights.Add(new RoomInsight(resource.Id, resource.Name, occupancy, rows));
        }

        return insights;
    }

    private static IReadOnlyList<TimelinePoint> BuildRoomTimeline(IReadOnlyList<Reservation> reservations)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var points = new List<TimelinePoint>(7);

        foreach (var offset in Enumerable.Range(0, 7))
        {
            var day = today.AddDays(offset);
            var windowStart = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var windowEnd = day.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            var hours = reservations
                .Where(r => r.StartUtc < windowEnd && r.EndUtc > windowStart)
                .Sum(r => GetOverlapHours(r, windowStart, windowEnd));

            var utilization = Math.Clamp((decimal)(hours / 24d) * 100m, 0, 100);
            points.Add(new TimelinePoint(day, Math.Round(utilization, 2)));
        }

        return points;
    }

    private static double GetOverlapHours(Reservation reservation, DateTime windowStart, DateTime windowEnd)
    {
        var start = reservation.StartUtc > windowStart ? reservation.StartUtc : windowStart;
        var end = reservation.EndUtc < windowEnd ? reservation.EndUtc : windowEnd;
        return end <= start ? 0 : (end - start).TotalHours;
    }

    private static bool IsPaid(PaymentTransaction transaction)
        => string.Equals(transaction.Status, "Paid", StringComparison.OrdinalIgnoreCase);
}

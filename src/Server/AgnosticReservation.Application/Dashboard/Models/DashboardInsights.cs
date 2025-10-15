using System;

namespace AgnosticReservation.Application.Dashboard.Models;

public record TimelinePoint(DateOnly Date, decimal Value);

public record UtilizationRevenueRow(
    Guid UserId,
    Guid ResourceId,
    string UserName,
    string ResourceName,
    double HoursUsed,
    decimal AmountPaid,
    int ReservationCount);

public record UsageInsight(
    IReadOnlyList<TimelinePoint> Timeline,
    IReadOnlyList<UtilizationRevenueRow> Breakdown);

public record RevenueInsight(
    IReadOnlyList<TimelinePoint> Timeline,
    IReadOnlyList<UtilizationRevenueRow> Breakdown);

public record RoomReservationRow(
    Guid ReservationId,
    Guid ResourceId,
    string ResourceName,
    Guid UserId,
    string UserName,
    DateTime StartUtc,
    DateTime EndUtc,
    string Status,
    decimal AmountPaid);

public record RoomInsight(
    Guid ResourceId,
    string ResourceName,
    IReadOnlyList<TimelinePoint> Occupancy,
    IReadOnlyList<RoomReservationRow> Reservations);

public record DashboardInsights(
    UsageInsight Usage,
    RevenueInsight Revenue,
    IReadOnlyList<RoomInsight> Rooms);

namespace AgnosticReservation.Domain.ValueObjects;

public record DateRange(DateTime StartUtc, DateTime EndUtc)
{
    public static DateRange Create(DateTime startUtc, DateTime endUtc)
    {
        if (endUtc <= startUtc)
        {
            throw new ArgumentException("End must be greater than start");
        }

        return new DateRange(startUtc, endUtc);
    }

    public bool Overlaps(DateRange other)
        => StartUtc < other.EndUtc && other.StartUtc < EndUtc;
}

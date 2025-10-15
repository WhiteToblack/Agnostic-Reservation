using System;

namespace AgnosticReservation.Application.Auth;

public class SessionOptions
{
    public int IdleTimeoutMinutes { get; set; } = 15;

    public TimeSpan IdleTimeout => TimeSpan.FromMinutes(Math.Max(1, IdleTimeoutMinutes));
}

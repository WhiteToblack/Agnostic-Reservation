using System.Threading;
using AgnosticReservation.Application.Context;

namespace AgnosticReservation.Infrastructure.Services;

public class SessionContextAccessor : ISessionContextAccessor
{
    private static readonly AsyncLocal<SessionContextHolder?> Holder = new();

    public ISessionContext Current => Holder.Value?.Context ?? SessionContext.Empty;

    public void SetSession(SessionContextData data)
    {
        Holder.Value = new SessionContextHolder(new SessionContext(data));
    }

    public void Clear()
    {
        Holder.Value = null;
    }

    private sealed class SessionContextHolder
    {
        public SessionContextHolder(SessionContext context)
        {
            Context = context;
        }

        public SessionContext Context { get; set; }
    }
}

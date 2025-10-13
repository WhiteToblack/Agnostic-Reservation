namespace AgnosticReservation.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; private set; }
    public string? Domain { get; private set; }
    public string DefaultTheme { get; private set; }
    public ICollection<User> Users { get; private set; } = new List<User>();
    public ICollection<TenantParameter> Parameters { get; private set; } = new List<TenantParameter>();
    public ICollection<Resource> Resources { get; private set; } = new List<Resource>();
    public ICollection<Document> Documents { get; private set; } = new List<Document>();

    private Tenant() : base()
    {
        Name = string.Empty;
        DefaultTheme = "light";
    }

    public Tenant(string name, string? domain, string defaultTheme = "light")
    {
        Name = name;
        Domain = domain;
        DefaultTheme = defaultTheme;
    }

    public void UpdateTheme(string theme)
    {
        DefaultTheme = theme;
    }
}

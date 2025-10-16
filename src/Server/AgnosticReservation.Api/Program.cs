using AgnosticReservation.Api.Middleware;
using AgnosticReservation.Api.Modules;
using AgnosticReservation.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
    );
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    if (!string.IsNullOrWhiteSpace(connectionString))
    {
        options.UseSqlServer(connectionString);
    }
    else
    {
        options.UseInMemoryDatabase("agnostic-reservation");
    }
});
builder.Services.AddAgnosticReservationModules(builder.Configuration);

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAll");
if (IsHttpsEndpointConfigured(builder))
{
    app.UseHttpsRedirection();
}

app.UseSessionContext();
app.UseRequestLogging();
app.UseAuthorization();
app.MapControllers();

app.Run();

static bool IsHttpsEndpointConfigured(WebApplicationBuilder builder)
{
    if (builder.Configuration.GetValue<int?>(WebHostDefaults.HttpsPortsKey) is not null)
    {
        return true;
    }

    if (
        builder.Configuration.GetValue<string>(WebHostDefaults.ServerUrlsKey) is string urls
        && urls.Split(';', StringSplitOptions.RemoveEmptyEntries)
            .Any(url => url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
    )
    {
        return true;
    }

    var kestrelEndpoints = builder.Configuration.GetSection("Kestrel:Endpoints");

    foreach (var endpoint in kestrelEndpoints.GetChildren())
    {
        if (
            endpoint.GetValue<string>("Url") is string endpointUrl
            && endpointUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
        )
        {
            return true;
        }

        if (endpoint.GetSection("Certificate").Exists())
        {
            return true;
        }
    }

    return false;
}

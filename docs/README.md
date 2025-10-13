# Agnostic Reservation Monorepo Starter

This monorepo delivers a macro-service starter kit that pairs a modular .NET 8 backend with reusable React Native user interfaces for mobile and responsive web.

## Repository Layout

```
.
├── apps
│   ├── mobile        # React Native (TypeScript) application with modular navigation
│   └── web           # React Native Web entry for browser-based admin/dashboard
├── docs              # Project-wide documentation
└── src
    ├── Server        # .NET 8 solution with modular architecture
    └── Tests         # xUnit test project
```

## Backend Overview

* **Architecture**: Domain-driven layering (Api, Application, Domain, Infrastructure) with repository pattern and EF Core (`AppDbContext`).
* **Modules**: Auth, Reservations, Dashboard, Admin (parameters/cache/documents), Notifications. Each module is exposed through dedicated controllers.
* **Persistence**: EF Core supports SQL Server via the provided connection string (see `appsettings.json`). Falls back to the InMemory provider when no connection string is configured.
* **Caching**: `ICacheService` abstraction with in-memory implementation and Redis adapter extension point.
* **Notifications**: `INotificationService` interface ready for Push/SMS/Email adapters.
* **Documents**: `IDocumentService` interface storing files in-memory; swap with S3/MinIO adapter.
* **Dashboard Widgets**: `WidgetType` enum and widget entities cover KPI Card, Calendar Mini, QuickBook, Utilization Chart, Stock Alerts, and Payments Reconcile.
* **Tenant Theme**: `User.PreferredTheme` persisted and managed via `AuthController.UpdateTheme`.

## Frontend Overview

* **Mobile**: React Native app leveraging reusable component library (`components/`) and stack/tab navigation.
* **Web**: React Native Web setup using Expo Router-compatible structure; shares components with mobile via `apps/shared` barrel exports.
* **Screens**: Authentication, reservation agenda, dashboards by role, admin tools (parameters, cache, documents, theme tokens).

## Getting Started

1. **Backend**
   ```bash
   dotnet restore src/Server/AgnosticReservation.sln
   dotnet build src/Server/AgnosticReservation.sln
   dotnet run --project src/Server/AgnosticReservation.Api/AgnosticReservation.Api.csproj
   ```

2. **Mobile**
   ```bash
   cd apps/mobile
   npm install
   npm run start
   ```

3. **Web**
   ```bash
   cd apps/web
   npm install
   npm run web
   ```

## Testing

```bash
dotnet test src/Tests/AgnosticReservation.Tests/AgnosticReservation.Tests.csproj
```

React Native component tests can be added with Jest and React Native Testing Library (scaffolding left ready in `package.json`).

## Database

* **Schema**: Run `docs/sql/agnostic_reservation_mssql.sql` on your SQL Server instance to create all tables, foreign keys, and indexes that map to the domain entities.
* **Configuration**: Set `Database:Provider` to `SqlServer` and provide the credentials in `Database:ConnectionString` (or `ConnectionStrings:DefaultConnection`) inside `src/Server/AgnosticReservation.Api/appsettings.json`, user secrets, or environment variables. Optional flag `Database:EnableSensitiveLogging` surfaces EF Core parameter values for local troubleshooting.
* **Local development**: Switch `Database:Provider` to `InMemory` or omit the connection string to automatically fall back to the EF Core InMemory provider for lightweight testing.

## Extension Points

* Swap the cache implementation by binding `ICacheService` to a Redis-backed service.
* Register notification providers (FCM, SendGrid, NetGSM) by implementing `INotificationService` or decorating the default logger-backed version.
* Extend EF Core model to include full MSSQL schema by adding configurations under `Infrastructure/Persistence/Configurations`.
* Build additional dashboard widgets (e.g., UtilizationChart) by updating the shared component library and `WidgetType` enum.

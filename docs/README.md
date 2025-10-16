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

### Troubleshooting

* **Expo / React Native runtime uyumsuzluğu**: `TurboModuleRegistry.getEnforcing('PlatformConstants')` gibi hatalar için [docs/troubleshooting-mobile.md](./troubleshooting-mobile.md) dokümanındaki adımları izleyin.

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
* **Localization seed**: After provisioning the schema, execute `docs/sql/agnostic_reservation_multilanguage_seed.sql` to preload sample multi-language keys and translations for every demo tenant.
* **Connection string**: Update `ConnectionStrings:DefaultConnection` in `src/Server/AgnosticReservation.Api/appsettings.json` (or user secrets/environment variables) with your SQL Server credentials.
* **Local development stack**: A ready-to-use Docker Compose file lives at the repository root. Start it before executing migrations or accessing MongoDB:

  ```bash
  docker compose -f compose.infrastructure.yml up -d
  ```

  The compose stack now starts three containers that cover the full local experience:

  * **RootTA API** (`rootta` service) running the ASP.NET Core backend on [http://localhost:8080](http://localhost:8080). The container builds from the root-level `Dockerfile`, uses the in-memory EF Core provider by default, and writes structured request logs to MongoDB.
  * **MongoDB 6.0** with the default admin user `rootta_admin` and password `RoottaDev!123`, exposed on `localhost:27017` for request logging and experimentation.
  * **Mongo Express** on [http://localhost:8081](http://localhost:8081) with basic auth credentials `rootta_dash` / `RoottaExpress!123` for browsing the logging collections. These defaults can be overridden by exporting `MONGODB_ROOT_USERNAME`, `MONGODB_ROOT_PASSWORD`, `MONGO_EXPRESS_USERNAME`, or `MONGO_EXPRESS_PASSWORD` before starting the stack.
* **Local fallback**: If the connection string is omitted, the API will automatically fall back to the EF Core InMemory provider for lightweight testing.
* **Migrations**: Because `AppDbContext` lives in the Infrastructure project, run EF Core CLI commands from the API directory while pointing the `--project` flag at the Infrastructure `.csproj`:

  ```bash
  cd src/Server/AgnosticReservation.Api
  dotnet ef migrations add InitialCreate \
      --project ../AgnosticReservation.Infrastructure/AgnosticReservation.Infrastructure.csproj \
      --startup-project AgnosticReservation.Api.csproj
  dotnet ef database update \
      --project ../AgnosticReservation.Infrastructure/AgnosticReservation.Infrastructure.csproj \
      --startup-project AgnosticReservation.Api.csproj

  # İlk kurulum için varsayılan tenant parametrelerini ve yönetici kullanıcıları oluşturur
  dotnet ef database update \
      --project ../AgnosticReservation.Infrastructure/AgnosticReservation.Infrastructure.csproj \
      --startup-project AgnosticReservation.Api.csproj \
      -- --initialize
  ```

## Extension Points

* Swap the cache implementation by binding `ICacheService` to a Redis-backed service.
* Register notification providers (FCM, SendGrid, NetGSM) by implementing `INotificationService` or decorating the default logger-backed version.
* Extend EF Core model to include full MSSQL schema by adding configurations under `Infrastructure/Persistence/Configurations`.
* Build additional dashboard widgets (e.g., UtilizationChart) by updating the shared component library and `WidgetType` enum.

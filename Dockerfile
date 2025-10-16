# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# copy solution and project files for restore
COPY src/Server/AgnosticReservation.sln ./
COPY src/Server/AgnosticReservation.Api/AgnosticReservation.Api.csproj src/Server/AgnosticReservation.Api/
COPY src/Server/AgnosticReservation.Application/AgnosticReservation.Application.csproj src/Server/AgnosticReservation.Application/
COPY src/Server/AgnosticReservation.Domain/AgnosticReservation.Domain.csproj src/Server/AgnosticReservation.Domain/
COPY src/Server/AgnosticReservation.Infrastructure/AgnosticReservation.Infrastructure.csproj src/Server/AgnosticReservation.Infrastructure/

RUN dotnet restore src/Server/AgnosticReservation.Api/AgnosticReservation.Api.csproj

# copy the remaining source code and publish
COPY src/Server/ src/Server/

RUN dotnet publish src/Server/AgnosticReservation.Api/AgnosticReservation.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "AgnosticReservation.Api.dll"]

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgnosticReservation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardUserCustomization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LayoutConfigJson",
                table: "Dashboards",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Dashboards",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Dashboards_TenantId_RoleId_UserId",
                table: "Dashboards",
                columns: new[] { "TenantId", "RoleId", "UserId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Dashboards_TenantId_RoleId_UserId",
                table: "Dashboards");

            migrationBuilder.DropColumn(
                name: "LayoutConfigJson",
                table: "Dashboards");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Dashboards");
        }
    }
}

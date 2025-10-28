using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pharmacy_pos.Migrations
{
    /// <inheritdoc />
    public partial class FixSeedData8 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.InsertData(
                table: "User",
                columns: new[] { "Id", "CreatedAt", "Email", "Name", "Password", "RoleId", "Status" },
                values: new object[] { 2, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "superadmin@pharmacy.com", "SuperAdmin", "$2a$11$sM9wvXwUTvk.of/NhyQ1BO.BCHuUONz5.2wxAQo2l7sC4z4BC6Onm", 1, "Active" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.InsertData(
                table: "User",
                columns: new[] { "Id", "CreatedAt", "Email", "Name", "Password", "RoleId", "Status" },
                values: new object[] { 1, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "superadmin@pharmacy.com", "SuperAdmin", "$2a$11$sM9wvXwUTvk.of/NhyQ1BO.BCHuUONz5.2wxAQo2l7sC4z4BC6Onm", 1, "Active" });
        }
    }
}

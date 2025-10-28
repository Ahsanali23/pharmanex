using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pharmacy_pos.Migrations
{
    /// <inheritdoc />
    public partial class FixSeedData1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$sM9wvXwUTvk.of/NhyQ1BO.BCHuUONz5.2wxAQo2l7sC4z4BC6Onm");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                column: "Password",
                value: "PLACEHOLDER");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pharmacy_pos.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProf2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Permission",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.InsertData(
                table: "Permission",
                columns: new[] { "Id", "Module", "Name" },
                values: new object[] { 77, "Customer", "Customer.Add" });

            migrationBuilder.UpdateData(
                table: "RolePermission",
                keyColumn: "Id",
                keyValue: -9,
                column: "PermissionId",
                value: 77);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Permission",
                keyColumn: "Id",
                keyValue: 77);

            migrationBuilder.InsertData(
                table: "Permission",
                columns: new[] { "Id", "Module", "Name" },
                values: new object[] { 7, "Customer", "Customer.Add" });

            migrationBuilder.UpdateData(
                table: "RolePermission",
                keyColumn: "Id",
                keyValue: -9,
                column: "PermissionId",
                value: 7);
        }
    }
}

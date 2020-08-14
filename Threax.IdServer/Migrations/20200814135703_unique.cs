using Microsoft.EntityFrameworkCore.Migrations;

namespace Threax.IdServer.Migrations
{
    public partial class unique : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Scopes_Name",
                table: "Scopes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clients_ClientId",
                table: "Clients",
                column: "ClientId",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Scopes_Name",
                table: "Scopes");

            migrationBuilder.DropIndex(
                name: "IX_Clients_ClientId",
                table: "Clients");
        }
    }
}

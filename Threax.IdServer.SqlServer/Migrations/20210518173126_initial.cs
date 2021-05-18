using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Threax.IdServer.SqlServer.Migrations
{
    public partial class initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "id");

            migrationBuilder.CreateTable(
                name: "Clients",
                schema: "id",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    LogoutUri = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AllowedGrantTypes = table.Column<int>(type: "int", nullable: false),
                    AccessTokenLifetime = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Scopes",
                schema: "id",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DisplayName = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Scopes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClientRedirectUri",
                schema: "id",
                columns: table => new
                {
                    ClientRedirectUriId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    Uri = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientRedirectUri", x => x.ClientRedirectUriId);
                    table.ForeignKey(
                        name: "FK_ClientRedirectUri_Clients_ClientId",
                        column: x => x.ClientId,
                        principalSchema: "id",
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClientScope",
                schema: "id",
                columns: table => new
                {
                    ClientScopeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    Scope = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientScope", x => x.ClientScopeId);
                    table.ForeignKey(
                        name: "FK_ClientScope_Clients_ClientId",
                        column: x => x.ClientId,
                        principalSchema: "id",
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClientSecret",
                schema: "id",
                columns: table => new
                {
                    ClientSecretId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    Secret = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientSecret", x => x.ClientSecretId);
                    table.ForeignKey(
                        name: "FK_ClientSecret_Clients_ClientId",
                        column: x => x.ClientId,
                        principalSchema: "id",
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientRedirectUri_ClientId",
                schema: "id",
                table: "ClientRedirectUri",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_ClientId",
                schema: "id",
                table: "Clients",
                column: "ClientId",
                unique: true,
                filter: "[ClientId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ClientScope_ClientId",
                schema: "id",
                table: "ClientScope",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientSecret_ClientId",
                schema: "id",
                table: "ClientSecret",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Scopes_Name",
                schema: "id",
                table: "Scopes",
                column: "Name",
                unique: true,
                filter: "[Name] IS NOT NULL");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientRedirectUri",
                schema: "id");

            migrationBuilder.DropTable(
                name: "ClientScope",
                schema: "id");

            migrationBuilder.DropTable(
                name: "ClientSecret",
                schema: "id");

            migrationBuilder.DropTable(
                name: "Scopes",
                schema: "id");

            migrationBuilder.DropTable(
                name: "Clients",
                schema: "id");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Threax.IdServer.SqlServer.Migrations.AppDb
{
    public partial class initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "id");

            migrationBuilder.CreateTable(
                name: "spc.auth.Roles",
                schema: "id",
                columns: table => new
                {
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_spc.auth.Roles", x => x.RoleId);
                });

            migrationBuilder.CreateTable(
                name: "spc.auth.Users",
                schema: "id",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_spc.auth.Users", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "spc.auth.UsersToRoles",
                schema: "id",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_spc.auth.UsersToRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_spc.auth.UsersToRoles_spc.auth.Roles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "id",
                        principalTable: "spc.auth.Roles",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_spc.auth.UsersToRoles_spc.auth.Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "id",
                        principalTable: "spc.auth.Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_spc.auth.UsersToRoles_RoleId",
                schema: "id",
                table: "spc.auth.UsersToRoles",
                column: "RoleId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "spc.auth.UsersToRoles",
                schema: "id");

            migrationBuilder.DropTable(
                name: "spc.auth.Roles",
                schema: "id");

            migrationBuilder.DropTable(
                name: "spc.auth.Users",
                schema: "id");
        }
    }
}

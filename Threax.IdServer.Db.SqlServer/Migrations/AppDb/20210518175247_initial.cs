using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Threax.IdServer.EntityFramework.DbContexts;

namespace Threax.IdServer.SqlServer.Migrations.AppDb
{
    public partial class initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: AppDbContext.SchemaName);

            migrationBuilder.CreateTable(
                name: "spc.auth.Roles",
                schema: AppDbContext.SchemaName,
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
                schema: AppDbContext.SchemaName,
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
                schema: AppDbContext.SchemaName,
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
                        principalSchema: AppDbContext.SchemaName,
                        principalTable: "spc.auth.Roles",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_spc.auth.UsersToRoles_spc.auth.Users_UserId",
                        column: x => x.UserId,
                        principalSchema: AppDbContext.SchemaName,
                        principalTable: "spc.auth.Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_spc.auth.UsersToRoles_RoleId",
                schema: AppDbContext.SchemaName,
                table: "spc.auth.UsersToRoles",
                column: "RoleId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "spc.auth.UsersToRoles",
                schema: AppDbContext.SchemaName);

            migrationBuilder.DropTable(
                name: "spc.auth.Roles",
                schema: AppDbContext.SchemaName);

            migrationBuilder.DropTable(
                name: "spc.auth.Users",
                schema: AppDbContext.SchemaName);
        }
    }
}

using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

namespace TestApi.Migrations
{
    public partial class horriblebeasts : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HorribleBeasts",
                columns: table => new
                {
                    HorribleBeastId = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(nullable: true),
                    NumEyes = table.Column<int>(nullable: false),
                    NumLegs = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HorribleBeasts", x => x.HorribleBeastId);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HorribleBeasts");
        }
    }
}

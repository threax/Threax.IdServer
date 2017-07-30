using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using TestApi.Database;

namespace TestApi.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20170730203007_initial")]
    partial class initial
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
            modelBuilder
                .HasAnnotation("ProductVersion", "1.1.2")
                .HasAnnotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn);

            modelBuilder.Entity("TestApi.Database.ValueEntity", b =>
                {
                    b.Property<Guid>("ValueId")
                        .ValueGeneratedOnAdd();

                    b.Property<string>("Name");

                    b.HasKey("ValueId");

                    b.ToTable("Values");
                });
        }
    }
}

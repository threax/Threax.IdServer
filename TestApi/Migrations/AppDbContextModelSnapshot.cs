﻿using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using TestApi.Database;

namespace TestApi.Migrations
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder
                .HasAnnotation("ProductVersion", "1.1.2")
                .HasAnnotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn);

            modelBuilder.Entity("TestApi.Database.HorribleBeastEntity", b =>
                {
                    b.Property<Guid>("HorribleBeastId")
                        .ValueGeneratedOnAdd();

                    b.Property<string>("Name");

                    b.Property<int>("NumEyes");

                    b.Property<int>("NumLegs");

                    b.HasKey("HorribleBeastId");

                    b.ToTable("HorribleBeasts");
                });

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

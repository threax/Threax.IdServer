﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Threax.IdServer.EntityFramework.DbContexts;

namespace Threax.IdServer.SqLite.Migrations.AppDb
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20210518154827_net5rebuild")]
    partial class net5rebuild
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "5.0.6");

            modelBuilder.Entity("Threax.AspNetCore.UserBuilder.Entities.Role", b =>
                {
                    b.Property<Guid>("RoleId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("TEXT");

                    b.Property<string>("Name")
                        .HasMaxLength(450)
                        .HasColumnType("TEXT");

                    b.HasKey("RoleId");

                    b.ToTable("spc.auth.Roles");
                });

            modelBuilder.Entity("Threax.AspNetCore.UserBuilder.Entities.User", b =>
                {
                    b.Property<Guid>("UserId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("TEXT");

                    b.Property<string>("Name")
                        .HasMaxLength(450)
                        .HasColumnType("TEXT");

                    b.HasKey("UserId");

                    b.ToTable("spc.auth.Users");
                });

            modelBuilder.Entity("Threax.AspNetCore.UserBuilder.Entities.UserToRole", b =>
                {
                    b.Property<Guid>("UserId")
                        .HasColumnType("TEXT");

                    b.Property<Guid>("RoleId")
                        .HasColumnType("TEXT");

                    b.HasKey("UserId", "RoleId");

                    b.HasIndex("RoleId");

                    b.ToTable("spc.auth.UsersToRoles");
                });

            modelBuilder.Entity("Threax.AspNetCore.UserBuilder.Entities.UserToRole", b =>
                {
                    b.HasOne("Threax.AspNetCore.UserBuilder.Entities.Role", "Role")
                        .WithMany("Users")
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Threax.AspNetCore.UserBuilder.Entities.User", "User")
                        .WithMany("Roles")
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Role");

                    b.Navigation("User");
                });

            modelBuilder.Entity("Threax.AspNetCore.UserBuilder.Entities.Role", b =>
                {
                    b.Navigation("Users");
                });

            modelBuilder.Entity("Threax.AspNetCore.UserBuilder.Entities.User", b =>
                {
                    b.Navigation("Roles");
                });
#pragma warning restore 612, 618
        }
    }
}

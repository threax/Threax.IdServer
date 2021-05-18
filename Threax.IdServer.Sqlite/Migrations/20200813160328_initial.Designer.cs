﻿// <auto-generated />
using System;
using Threax.IdServer.EntityFramework.DbContexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Threax.IdServer.SqLite.Migrations
{
    [DbContext(typeof(ConfigurationDbContext))]
    [Migration("20200813160328_initial")]
    partial class initial
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "3.1.6");

            modelBuilder.Entity("Threax.IdServer.EntityFramework.Entities.Client", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<int>("AccessTokenLifetime")
                        .HasColumnType("INTEGER");

                    b.Property<int>("AllowedGrantTypes")
                        .HasColumnType("INTEGER");

                    b.Property<string>("ClientId")
                        .HasColumnType("TEXT")
                        .HasMaxLength(200);

                    b.Property<string>("LogoutUri")
                        .HasColumnType("TEXT")
                        .HasMaxLength(2000);

                    b.Property<string>("Name")
                        .HasColumnType("TEXT")
                        .HasMaxLength(200);

                    b.HasKey("Id");

                    b.ToTable("Clients");
                });

            modelBuilder.Entity("Threax.IdServer.EntityFramework.Entities.ClientRedirectUri", b =>
                {
                    b.Property<Guid>("ClientRedirectUriId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("TEXT");

                    b.Property<int>("ClientId")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Uri")
                        .HasColumnType("TEXT")
                        .HasMaxLength(2000);

                    b.HasKey("ClientRedirectUriId");

                    b.HasIndex("ClientId");

                    b.ToTable("ClientRedirectUri");
                });

            modelBuilder.Entity("Threax.IdServer.EntityFramework.Entities.ClientScope", b =>
                {
                    b.Property<Guid>("ClientScopeId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("TEXT");

                    b.Property<int>("ClientId")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Scope")
                        .HasColumnType("TEXT")
                        .HasMaxLength(2000);

                    b.HasKey("ClientScopeId");

                    b.HasIndex("ClientId");

                    b.ToTable("ClientScope");
                });

            modelBuilder.Entity("Threax.IdServer.EntityFramework.Entities.ClientSecret", b =>
                {
                    b.Property<Guid>("ClientSecretId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("TEXT");

                    b.Property<int>("ClientId")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Secret")
                        .HasColumnType("TEXT")
                        .HasMaxLength(2000);

                    b.HasKey("ClientSecretId");

                    b.HasIndex("ClientId");

                    b.ToTable("ClientSecret");
                });

            modelBuilder.Entity("Threax.IdServer.EntityFramework.Entities.Scope", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("DisplayName")
                        .HasColumnType("TEXT")
                        .HasMaxLength(1000);

                    b.Property<string>("Name")
                        .HasColumnType("TEXT")
                        .HasMaxLength(1000);

                    b.HasKey("Id");

                    b.ToTable("Scopes");
                });

            modelBuilder.Entity("Threax.IdServer.EntityFramework.Entities.ClientRedirectUri", b =>
                {
                    b.HasOne("Threax.IdServer.EntityFramework.Entities.Client", "Client")
                        .WithMany("RedirectUris")
                        .HasForeignKey("ClientId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Threax.IdServer.EntityFramework.Entities.ClientScope", b =>
                {
                    b.HasOne("Threax.IdServer.EntityFramework.Entities.Client", "Client")
                        .WithMany("AllowedScopes")
                        .HasForeignKey("ClientId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Threax.IdServer.EntityFramework.Entities.ClientSecret", b =>
                {
                    b.HasOne("Threax.IdServer.EntityFramework.Entities.Client", "Client")
                        .WithMany("ClientSecrets")
                        .HasForeignKey("ClientId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });
#pragma warning restore 612, 618
        }
    }
}

﻿// <auto-generated />
using System;
using IdentityServer4.EntityFramework.DbContexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Threax.IdServer.Migrations
{
    [DbContext(typeof(ConfigurationDbContext))]
    partial class ConfigurationDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "3.1.7");

            modelBuilder.Entity("IdentityServer4.EntityFramework.Entities.Client", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<int>("AccessTokenLifetime")
                        .HasColumnType("INTEGER");

                    b.Property<int>("AllowedGrantTypes")
                        .HasColumnType("INTEGER");

                    b.Property<string>("ClientId")
                        .HasMaxLength(200)
                        .HasColumnType("TEXT");

                    b.Property<string>("LogoutUri")
                        .HasMaxLength(2000)
                        .HasColumnType("TEXT");

                    b.Property<string>("Name")
                        .HasMaxLength(200)
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.HasIndex("ClientId")
                        .IsUnique();

                    b.ToTable("Clients");
                });

            modelBuilder.Entity("IdentityServer4.EntityFramework.Entities.ClientRedirectUri", b =>
                {
                    b.Property<Guid>("ClientRedirectUriId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("TEXT");

                    b.Property<int>("ClientId")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Uri")
                        .HasMaxLength(2000)
                        .HasColumnType("TEXT");

                    b.HasKey("ClientRedirectUriId");

                    b.HasIndex("ClientId");

                    b.ToTable("ClientRedirectUri");
                });

            modelBuilder.Entity("IdentityServer4.EntityFramework.Entities.ClientScope", b =>
                {
                    b.Property<Guid>("ClientScopeId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("TEXT");

                    b.Property<int>("ClientId")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Scope")
                        .HasMaxLength(2000)
                        .HasColumnType("TEXT");

                    b.HasKey("ClientScopeId");

                    b.HasIndex("ClientId");

                    b.ToTable("ClientScope");
                });

            modelBuilder.Entity("IdentityServer4.EntityFramework.Entities.ClientSecret", b =>
                {
                    b.Property<Guid>("ClientSecretId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("TEXT");

                    b.Property<int>("ClientId")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Secret")
                        .HasMaxLength(2000)
                        .HasColumnType("TEXT");

                    b.HasKey("ClientSecretId");

                    b.HasIndex("ClientId");

                    b.ToTable("ClientSecret");
                });

            modelBuilder.Entity("IdentityServer4.EntityFramework.Entities.Scope", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("DisplayName")
                        .HasMaxLength(1000)
                        .HasColumnType("TEXT");

                    b.Property<string>("Name")
                        .HasMaxLength(1000)
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.HasIndex("Name")
                        .IsUnique();

                    b.ToTable("Scopes");
                });

            modelBuilder.Entity("IdentityServer4.EntityFramework.Entities.ClientRedirectUri", b =>
                {
                    b.HasOne("IdentityServer4.EntityFramework.Entities.Client", "Client")
                        .WithMany("RedirectUris")
                        .HasForeignKey("ClientId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Client");
                });

            modelBuilder.Entity("IdentityServer4.EntityFramework.Entities.ClientScope", b =>
                {
                    b.HasOne("IdentityServer4.EntityFramework.Entities.Client", "Client")
                        .WithMany("AllowedScopes")
                        .HasForeignKey("ClientId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Client");
                });

            modelBuilder.Entity("IdentityServer4.EntityFramework.Entities.ClientSecret", b =>
                {
                    b.HasOne("IdentityServer4.EntityFramework.Entities.Client", "Client")
                        .WithMany("ClientSecrets")
                        .HasForeignKey("ClientId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Client");
                });

            modelBuilder.Entity("IdentityServer4.EntityFramework.Entities.Client", b =>
                {
                    b.Navigation("AllowedScopes");

                    b.Navigation("ClientSecrets");

                    b.Navigation("RedirectUris");
                });
#pragma warning restore 612, 618
        }
    }
}

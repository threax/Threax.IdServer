// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.


using Microsoft.EntityFrameworkCore;
using System;
using Threax.IdServer.EntityFramework.Entities;

namespace Threax.IdServer.EntityFramework.DbContexts
{
    /// <summary>
    /// DbContext for the IdentityServer configuration data.
    /// </summary>
    /// <seealso cref="Microsoft.EntityFrameworkCore.DbContext" />
    /// <seealso cref="Threax.IdServer.EntityFramework.Interfaces.IConfigurationDbContext" />
    public class ConfigurationDbContext : DbContext
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ConfigurationDbContext"/> class.
        /// </summary>
        /// <param name="options">The options.</param>
        /// <param name="storeOptions">The store options.</param>
        /// <exception cref="ArgumentNullException">storeOptions</exception>
        public ConfigurationDbContext(DbContextOptions<ConfigurationDbContext> options)
            : base(options)
        {

        }

        /// <summary>
        /// Gets or sets the clients.
        /// </summary>
        /// <value>
        /// The clients.
        /// </value>
        public DbSet<Client> Clients { get; set; }

        /// <summary>
        /// Gets or sets the API resources.
        /// </summary>
        /// <value>
        /// The API resources.
        /// </value>
        public DbSet<Scope> Scopes { get; set; }

        public DbSet<ClientRedirectUri> RedirectUris { get; set; }

        public DbSet<ClientScope> AllowedScopes { get; set; }

        public DbSet<ClientSecret> ClientSecrets { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema(AppDbContext.SchemaName);

            modelBuilder.Entity<Scope>()
                .HasIndex(u => u.Name)
                .IsUnique();

            modelBuilder.Entity<Client>()
                .HasIndex(u => u.ClientId)
                .IsUnique();
        }
    }
}
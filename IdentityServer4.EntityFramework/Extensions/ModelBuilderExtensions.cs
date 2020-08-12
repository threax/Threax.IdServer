// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.


using IdentityServer4.EntityFramework.Entities;
using IdentityServer4.EntityFramework.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IdentityServer4.EntityFramework.Extensions
{
    /// <summary>
    /// Extension methods to define the database schema for the configuration and operational data stores.
    /// </summary>
    public static class ModelBuilderExtensions
    {
        /// <summary>
        /// Configures the persisted grant context.
        /// </summary>
        /// <param name="modelBuilder">The model builder.</param>
        /// <param name="storeOptions">The store options.</param>
        public static void ConfigurePersistedGrantContext(this ModelBuilder modelBuilder, OperationalStoreOptions storeOptions)
        {
            if (!string.IsNullOrWhiteSpace(storeOptions.DefaultSchema)) modelBuilder.HasDefaultSchema(storeOptions.DefaultSchema);

            modelBuilder.Entity<PersistedGrant>(grant =>
            {
                grant.ToTable("PersistedGrants");

                grant.Property(x => x.Key).HasMaxLength(200).ValueGeneratedNever();
                grant.Property(x => x.Type).HasMaxLength(50).IsRequired();
                grant.Property(x => x.SubjectId).HasMaxLength(200);
                grant.Property(x => x.ClientId).HasMaxLength(200).IsRequired();
                grant.Property(x => x.CreationTime).IsRequired();
                // 50000 chosen to be explicit to allow enough size to avoid truncation, yet stay beneath the MySql row size limit of ~65K
                // apparently anything over 4K converts to nvarchar(max) on SqlServer
                grant.Property(x => x.Data).HasMaxLength(50000).IsRequired();

                grant.HasKey(x => x.Key);

                grant.HasIndex(x => new { x.SubjectId, x.ClientId, x.Type });
            });
        }
    }
}

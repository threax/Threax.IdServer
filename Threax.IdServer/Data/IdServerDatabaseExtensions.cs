using IdentityModel;
using IdentityServer4.Configuration;
using IdentityServer4.EntityFramework.Interfaces;
using IdentityServer4.EntityFramework.Mappers;
using IdentityServer4.Models;
using IdentityServer4.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Threax.Sqlite.Ext.EfCore3;
using static IdentityServer4.IdentityServerConstants;

namespace Threax.IdServer.Data
{
    public static class IdServerDatabaseExtensions
    {
        /// <summary>
        /// Add the standard config to identity server.
        /// </summary>
        /// <param name="idBuild"></param>
        /// <param name="config"></param>
        /// <returns></returns>
        public static IIdentityServerBuilder AddThreaxConfig(this IIdentityServerBuilder idBuild, AppConfig config)
        {
            var migrationsAssembly = typeof(Startup).GetTypeInfo().Assembly;
            var migrationsAssemblyName = migrationsAssembly.GetName().Name;

            idBuild
            .AddConfigurationStore(builder =>
            {
                builder.ConfigureDbContext = o =>
                {
                    o.UseSqlite(config.ConnectionString, options =>
                    {
                        options.MigrationsAssembly(migrationsAssemblyName);
                    });
                };
            })
            .AddOperationalStore(builder =>
            {
                builder.ConfigureDbContext = o =>
                {
                    o.UseSqlite(config.ConnectionString, options =>
                    {
                        options.MigrationsAssembly(migrationsAssemblyName);
                    });
                };
            });

            try
            {
                //Its possible this will fail and no cert will be loaded.
                //This is valid if the program is running in tools mode to make
                //its cert in the first place.
                var signingCert = Load(config.SigningCredentialCertThumb);
                if (signingCert != null)
                {
                    idBuild.AddSigningCredential(signingCert);
                }
            }
            catch(CryptographicException ex)
            {
                //We don't care that much about this exception, but log something to help with debugging
                //If any error occures that means no signing cert will be loaded, which will error later
                Console.WriteLine($"{ex.GetType().Name} loading signing cert. Message: {ex.Message}");
            }

            if (config.RolloverCertThumb != null)
            {
                idBuild.AddValidationKey(Load(config.RolloverCertThumb));
            }

            return idBuild;
        }

        public static X509Certificate2 Load(string thumbprint)
        {
            if (File.Exists(thumbprint))
            {
                return new X509Certificate2(thumbprint);
            }
            else
            {
                var store = new X509Store(StoreName.My, StoreLocation.LocalMachine);
                store.Open(OpenFlags.ReadOnly);
                var cert = store.Certificates.OfType<X509Certificate2>().FirstOrDefault(i => thumbprint.Equals(i.Thumbprint, System.StringComparison.OrdinalIgnoreCase));
                if (cert == null)
                {
                    throw new InvalidOperationException($"Cannot find token certificate with thumbprint {thumbprint} in the Local Computer's Personal Certificate Store.");
                }

                return cert;
            }
        }

        /// <summary>
        /// Setup and migrate the databases.
        /// </summary>
        /// <param name="scope">The current scope to use to initialize.</param>
        public static void MigrateIdServerDatabase(this IServiceScope scope)
        {
            //Migrate persisted grants
            var persistedGrantContext = scope.ServiceProvider.GetRequiredService<IPersistedGrantDbContext>();
            var persistedGrantDbContext = persistedGrantContext as DbContext;
            if (persistedGrantDbContext != null)
            {
                persistedGrantDbContext.Database.Migrate();
            }

            //Migrate configuration
            var configContext = scope.ServiceProvider.GetRequiredService<IConfigurationDbContext>();

            var configDbContext = configContext as DbContext;
            if (configDbContext != null)
            {
                configDbContext.Database.Migrate();
            }
        }

        /// <summary>
        /// Seed the id server database with fresh data.
        /// </summary>
        /// <param name="scope">The scope to use.</param>
        public static void SeedIdServerDatabase(this IServiceScope scope)
        {
            var configContext = scope.ServiceProvider.GetRequiredService<IConfigurationDbContext>();

            //Uncomment to force db to reload
            //configContext.Clients.RemoveRange(configContext.Clients);
            //configContext.ApiResources.RemoveRange(configContext.ApiResources);
            //configContext.SaveChanges();

            if (!configContext.Scopes.Any())
            {
                var idServerScope = new IdentityServer4.EntityFramework.Entities.Scope()
                {
                    Name = "Threax.IdServer",
                    DisplayName = "Identity Server",
                };
                configContext.Scopes.Add(idServerScope);

                configContext.SaveChanges();
            }
        }
    }
}

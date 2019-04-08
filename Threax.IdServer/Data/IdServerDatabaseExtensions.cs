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
            })
            .AddSigningCredential(Load(config.SigningCredentialCertThumb));

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
        /// <param name="appDashboardHost">The base url of the app dashboard host. Do not include https://</param>
        public static void SeedIdServerDatabase(this IServiceScope scope, String appDashboardHost)
        {
            var configContext = scope.ServiceProvider.GetRequiredService<IConfigurationDbContext>();

            if (!configContext.IdentityResources.Any())
            {
                configContext.IdentityResources.Add(new IdentityResources.Address().ToEntity());
                configContext.IdentityResources.Add(new IdentityResources.Email().ToEntity());
                configContext.IdentityResources.Add(new IdentityResources.OpenId().ToEntity());
                configContext.IdentityResources.Add(new IdentityResources.Phone().ToEntity());
                configContext.IdentityResources.Add(new IdentityResources.Profile().ToEntity());

                configContext.SaveChanges();
            }

            //Uncomment to force db to reload
            //configContext.Clients.RemoveRange(configContext.Clients);
            //configContext.ApiResources.RemoveRange(configContext.ApiResources);
            //configContext.SaveChanges();

            if (!configContext.ApiResources.Any())
            {
                var idServerResource = new ApiResource()
                {
                    Name = "Threax.IdServer",
                    Enabled = true,
                    DisplayName = "Identity Server",
                    Scopes = new List<Scope>()
                        {
                            new Scope()
                            {
                                Name = "Threax.IdServer"
                            }
                        }
                }.ToEntity();
                configContext.ApiResources.Add(idServerResource);

                var userDirectoryResource = new ApiResource()
                {
                    Name = "userdirectory",
                    Enabled = true,
                    DisplayName = "User Directory Api",
                    Scopes = new List<Scope>()
                        {
                            new Scope()
                            {
                                Name = "userdirectory"
                            }
                        }
                }.ToEntity();
                configContext.ApiResources.Add(userDirectoryResource);

                configContext.SaveChanges();
            }

            if (!configContext.Clients.Any())
            {
                //A bit hardcoded, but workable enough, activate the admin client
                var client = new IdentityServer4.Models.Client
                {
                    ClientId = "AppDashboard",
                    ClientName = "App Dashboard",
                    AllowedGrantTypes = GrantTypes.Hybrid,

                    ClientSecrets = new List<Secret>
                        {
                            new Secret("notyetdefined".Sha256())
                        },

                    AllowedScopes = new List<string>
                        {
                            StandardScopes.OpenId,
                            StandardScopes.Profile,
                            StandardScopes.OfflineAccess,
                            "Threax.IdServer",
                            "userdirectory"
                        },
                    RequireConsent = false,
                    AllowRememberConsent = true,
                    FrontChannelLogoutSessionRequired = true,
                    EnableLocalLogin = true,
                    AllowOfflineAccess = true
                };

                client.RedirectUris = new List<string>
                    {
                        $"https://{appDashboardHost}/signin-oidc"
                    };
                client.FrontChannelLogoutUri = $"https://{appDashboardHost}/Account/SignoutCleanup";

                configContext.Clients.Add(client.ToEntity());

                configContext.SaveChanges();
            }
        }
    }
}

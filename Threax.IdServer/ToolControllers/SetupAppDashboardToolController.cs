using IdentityModel;
using IdentityServer4.Configuration;
using IdentityServer4.EntityFramework.Entities;
using IdentityServer4.EntityFramework.Interfaces;
using IdentityServer4.EntityFramework.Mappers;
using IdentityServer4.Models;
using IdentityServer4.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using static IdentityServer4.IdentityServerConstants;

namespace Threax.IdServer.ToolControllers
{
    public class SetupAppDashboardToolController
    {
        private IConfigurationDbContext configContext;
        private readonly ILogger<SetupAppDashboardToolController> logger;
        private readonly AppConfig appConfig;

        public SetupAppDashboardToolController(IConfigurationDbContext configContext, ILogger<SetupAppDashboardToolController> logger, AppConfig appConfig)
        {
            this.configContext = configContext;
            this.logger = logger;
            this.appConfig = appConfig;
        }

        public async Task Run(String appDashboardHost, String clientSecretFile)
        {
            ClientSecret secret = null;
            if (clientSecretFile != null)
            {
                var secretString = AddFromMetadataToolController.TrimNewLine(File.ReadAllText(clientSecretFile));
                secret = new ClientSecret()
                {
                    Secret = HashExtensions.Sha256(secretString)
                };
                logger.LogInformation($"Updating app dashboard to host '{appDashboardHost}' with secret from '{clientSecretFile}'.");
            }
            else
            {
                secret = new ClientSecret()
                {
                    Secret = appConfig.DefaultSecret.Sha256()
                };
                logger.LogWarning($"Adding App dashboard '{appDashboardHost}' with default secret. This is not suitable for production deployments.");
            }

            var redirectUri = $"https://{appDashboardHost}/signin-oidc";
            var logoutUri = $"https://{appDashboardHost}/Account/SignoutCleanup";
            var clientEntity = await configContext.Clients
                            .Include(i => i.RedirectUris)
                            .Include(i => i.AllowedScopes)
                            .Include(i => i.ClientSecrets)
                            .FirstOrDefaultAsync(i => i.ClientId == "AppDashboard");

            if (clientEntity != null)
            {
                clientEntity.RedirectUris = new List<ClientRedirectUri>()
                {
                    new ClientRedirectUri()
                    {
                        Uri = redirectUri
                    }
                };
                clientEntity.LogoutUri = logoutUri;

                clientEntity.ClientSecrets.Clear();
                clientEntity.ClientSecrets.Add(secret);
            }
            else
            {
                var client = new IdentityServer4.EntityFramework.Entities.Client
                {
                    ClientId = "AppDashboard",
                    Name = "App Dashboard",
                    AllowedGrantTypes = IdentityServer4.EntityFramework.Entities.GrantTypes.Hybrid,
                    ClientSecrets = new List<ClientSecret>
                    {
                        secret
                    },
                    AllowedScopes = new List<ClientScope>
                    {
                        new ClientScope() { Scope = StandardScopes.OpenId },
                        new ClientScope() { Scope = StandardScopes.Profile },
                        new ClientScope() { Scope = StandardScopes.OfflineAccess },
                        new ClientScope() { Scope = "Threax.IdServer" },
                    },
                    RedirectUris = new List<ClientRedirectUri>()
                    {
                        new ClientRedirectUri() { Uri = redirectUri }
                    },
                    LogoutUri = logoutUri
                };

                configContext.Clients.Add(client);
            }

            await configContext.SaveChangesAsync();

            if (clientSecretFile != null)
            {
                logger.LogInformation($"Set app dashboard to host '{appDashboardHost}' with secret from '{clientSecretFile}'.");
            }
            else
            {
                logger.LogWarning($"Set app dashboard '{appDashboardHost}' with default secret. This is not suitable for production deployments.");
            }
        }
    }
}

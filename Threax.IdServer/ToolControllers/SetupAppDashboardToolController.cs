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

        public SetupAppDashboardToolController(IConfigurationDbContext configContext, ILogger<SetupAppDashboardToolController> logger)
        {
            this.configContext = configContext;
            this.logger = logger;
        }

        public async Task Run(String appDashboardHost, String clientSecretFile)
        {
            Secret secret = null;
            if(clientSecretFile != null)
            {
                var secretString = AddFromMetadataToolController.TrimNewLine(File.ReadAllText(clientSecretFile));
                secret = new Secret(HashExtensions.Sha256(secretString));
                logger.LogInformation($"Updating app dashboard to host '{appDashboardHost}' with secret from '{clientSecretFile}'.");
            }
            else
            {
                secret = new Secret(DefaultSecret.Secret);
                logger.LogWarning($"Adding App dashboard '{appDashboardHost}' with default secret. This is not suitable for production deployments.");
            }

            var redirectUri = $"https://{appDashboardHost}/signin-oidc";
            var frontChannelLogoutUri = $"https://{appDashboardHost}/Account/SignoutCleanup";
            var clientEntity = await configContext.Clients
                            .Include(i => i.AllowedGrantTypes)
                            .Include(i => i.RedirectUris)
                            .Include(i => i.AllowedScopes)
                            .Include(i => i.ClientSecrets)
                            .FirstOrDefaultAsync(i => i.ClientId == "AppDashboard");

            if (clientEntity != null)
            {
                clientEntity.RedirectUris = new List<IdentityServer4.EntityFramework.Entities.ClientRedirectUri>()
                {
                    new IdentityServer4.EntityFramework.Entities.ClientRedirectUri()
                    {
                        RedirectUri = redirectUri
                    }
                };
                clientEntity.FrontChannelLogoutUri = frontChannelLogoutUri;

                clientEntity.ClientSecrets.Clear();
                clientEntity.ClientSecrets.Add(new IdentityServer4.EntityFramework.Entities.ClientSecret()
                {
                    Client = clientEntity,
                    Value = secret.Value,
                    Description = secret.Description,
                    Expiration = secret.Expiration,
                    Type = secret.Type
                });
            }
            else
            {
                var client = new Client
                {
                    ClientId = "AppDashboard",
                    ClientName = "App Dashboard",
                    AllowedGrantTypes = GrantTypes.Hybrid,

                    ClientSecrets = new List<Secret>
                        {
                            secret
                        },

                    AllowedScopes = new List<string>
                        {
                            StandardScopes.OpenId,
                            StandardScopes.Profile,
                            StandardScopes.OfflineAccess,
                            "Threax.IdServer"
                        },
                    RequireConsent = false,
                    AllowRememberConsent = true,
                    FrontChannelLogoutSessionRequired = true,
                    EnableLocalLogin = true,
                    AllowOfflineAccess = true
                };

                client.RedirectUris = new List<string>
                {
                    redirectUri
                };
                client.FrontChannelLogoutUri = frontChannelLogoutUri;

                configContext.Clients.Add(client.ToEntity());
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

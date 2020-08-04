using AutoMapper;
using IdentityServer4.EntityFramework.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.IdServerMetadata.Client;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Models;
using Threax.IdServer.Repository;

namespace Threax.IdServer.ToolControllers
{
    public class AddFromMetadataToolController
    {
        private readonly IMetadataClient metadataClient;
        private readonly ILogger<AddFromMetadataToolController> logger;
        private readonly IMapper mapper;
        private readonly IClientRepository clientRepository;
        private readonly IApiResourceRepository apiResourceRepository;

        public AddFromMetadataToolController(IMetadataClient metadataClient, ILogger<AddFromMetadataToolController> logger, IMapper mapper, IClientRepository clientRepository, IApiResourceRepository apiResourceRepository)
        {
            this.metadataClient = metadataClient;
            this.logger = logger;
            this.mapper = mapper;
            this.clientRepository = clientRepository;
            this.apiResourceRepository = apiResourceRepository;
        }

        public async Task Run(String url, String clientSecretFile, String clientCredsSecretFile)
        {
            var clientSecret = File.ReadAllText(clientSecretFile);
            var clientCredsSecret = File.ReadAllText(clientCredsSecretFile);

            var scope = mapper.Map<ApiResourceInput>(await metadataClient.ScopeAsync(url));
            var client = mapper.Map<ClientInput>(await metadataClient.ClientAsync(url));
            var clientCreds = mapper.Map<ClientInput>(await metadataClient.ClientCredentialsAsync(url));

            await clientRepository.AddOrUpdateWithSecret(client, clientSecret);
            await clientRepository.AddOrUpdateWithSecret(clientCreds, clientCredsSecret);
            await apiResourceRepository.AddOrUpdate(scope);

            logger.LogInformation($"Updated app from '{url}' with latest metadata. Loaded client secret '{clientSecretFile}' and client creds secret '{clientCredsSecretFile}'.");
            logger.LogDebug($"Client secret '{clientSecret}'");
            logger.LogDebug($"Client cred secret '{clientCredsSecret}'");
        }
    }
}

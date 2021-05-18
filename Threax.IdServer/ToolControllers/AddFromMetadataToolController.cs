using AutoMapper;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading.Tasks;
using Threax.AspNetCore.IdServerMetadata.Client;
using Threax.IdServer.Areas.Api.InputModels;
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
        private readonly AppConfig appConfig;

        public AddFromMetadataToolController(IMetadataClient metadataClient, ILogger<AddFromMetadataToolController> logger, IMapper mapper, IClientRepository clientRepository, IApiResourceRepository apiResourceRepository, AppConfig appConfig)
        {
            this.metadataClient = metadataClient;
            this.logger = logger;
            this.mapper = mapper;
            this.clientRepository = clientRepository;
            this.apiResourceRepository = apiResourceRepository;
            this.appConfig = appConfig;
        }

        //This is used in the KeyPerFile config, so use it here as well. It sucks to modify the original string. It is unknown why it loads with a newline.
        //https://github.com/dotnet/aspnetcore/blob/master/src/Configuration.KeyPerFile/src/KeyPerFileConfigurationProvider.cs#L42
        public static string TrimNewLine(string value)
         => value.EndsWith(Environment.NewLine)
             ? value.Substring(0, value.Length - Environment.NewLine.Length)
             : value;

        public async Task Run(String url, String clientSecretFile, String clientCredsSecretFile)
        {
            var clientSecret = clientSecretFile != null ? TrimNewLine(File.ReadAllText(clientSecretFile)) : appConfig.DefaultSecret;
            var clientCredsSecret = clientCredsSecretFile != null ? TrimNewLine(File.ReadAllText(clientCredsSecretFile)) : appConfig.DefaultSecret;

            var scopeMeta = await metadataClient.ScopeAsync(url);
            var scope = mapper.Map<ApiResourceInput>(scopeMeta);
            var clientMeta = await metadataClient.ClientAsync(url);
            var client = mapper.Map<ClientInput>(clientMeta);
            var clientCredsMeta = await metadataClient.ClientCredentialsAsync(url);
            var clientCreds = mapper.Map<ClientInput>(clientCredsMeta);

            await apiResourceRepository.AddOrUpdate(scope);
            await clientRepository.AddOrUpdateWithSecret(client, clientSecret);
            await clientRepository.AddOrUpdateWithSecret(clientCreds, clientCredsSecret);

            logger.LogInformation($"Updated app from '{url}' with latest metadata.");
            if(clientSecretFile != null)
            {
                logger.LogInformation($"Loaded client secret file '{clientSecretFile}'.");
            }
            else
            {
                logger.LogWarning("Used default client secret. This is not suitable for production. This could allow attackers to grant access tokens for users.");
            }

            if(clientCredsSecretFile != null)
            {
                logger.LogInformation($"Loaded client creds secret file '{clientCredsSecretFile}'");
            }
            else
            {
                logger.LogWarning("Used default client creds secret. This is not suitable for production. This could allow attackers to log in as your client app.");
            }
        }
    }
}

using AutoMapper;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Threading.Tasks;
using Threax.AspNetCore.IdServerMetadata;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Repository;

namespace Threax.IdServer.ToolControllers
{
    public class AddFromClientCredsFileToolController
    {
        private readonly ILogger<AddFromMetadataToolController> logger;
        private readonly IMapper mapper;
        private readonly IClientRepository clientRepository;
        private readonly AppConfig appConfig;

        public AddFromClientCredsFileToolController(
            ILogger<AddFromMetadataToolController> logger,
            IMapper mapper,
            IClientRepository clientRepository,
            AppConfig appConfig)
        {
            this.logger = logger;
            this.mapper = mapper;
            this.clientRepository = clientRepository;
            this.appConfig = appConfig;
        }

        //This is used in the KeyPerFile config, so use it here as well. It sucks to modify the original string. It is unknown why it loads with a newline.
        //https://github.com/dotnet/aspnetcore/blob/master/src/Configuration.KeyPerFile/src/KeyPerFileConfigurationProvider.cs#L42
        public static string TrimNewLine(string value)
         => value.EndsWith(Environment.NewLine)
             ? value.Substring(0, value.Length - Environment.NewLine.Length)
             : value;

        public async Task Run(String clientCredsMetadataFile, String clientCredsSecretFile)
        {
            var clientCredsSecret = clientCredsSecretFile != null ? TrimNewLine(File.ReadAllText(clientCredsSecretFile)) : appConfig.DefaultSecret;

            var clientCredsMeta = JsonConvert.DeserializeObject<ClientMetadata>(File.ReadAllText(clientCredsMetadataFile));
            var clientCreds = mapper.Map<ClientInput>(clientCredsMeta);

            await clientRepository.AddOrUpdateWithSecret(clientCreds, clientCredsSecret);

            logger.LogInformation($"Updated app from '{clientCredsMetadataFile}' with latest metadata.");

            if (clientCredsSecretFile != null)
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

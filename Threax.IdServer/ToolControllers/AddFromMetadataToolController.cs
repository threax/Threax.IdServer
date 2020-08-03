using AutoMapper;
using IdentityServer4.EntityFramework.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.IdServerMetadata.Client;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Models;

namespace Threax.IdServer.ToolControllers
{
    public class AddFromMetadataToolController
    {
        private readonly IMetadataClient metadataClient;
        private readonly ILogger<AddFromMetadataToolController> logger;
        private readonly IMapper mapper;

        public AddFromMetadataToolController(IMetadataClient metadataClient, ILogger<AddFromMetadataToolController> logger, IMapper mapper)
        {
            this.metadataClient = metadataClient;
            this.logger = logger;
            this.mapper = mapper;
        }

        public async Task Run(String url)
        {
            var scope = mapper.Map<ApiResourceInput>(await metadataClient.ScopeAsync(url));
            var client = mapper.Map<ClientInput>(await metadataClient.ClientAsync(url));
            var clientCreds = mapper.Map<ClientInput>(await metadataClient.ClientCredentialsAsync(url));
        }
    }
}

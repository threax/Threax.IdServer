using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Net;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.IdServerMetadata.Client;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Areas.Api.Models;
using Threax.IdServer.InputModels;
using Threax.IdServer.Repository;

namespace Threax.IdServer.Areas.Api.Controllers
{
    /// <summary>
    /// Edit the client applications connected to this server.
    /// </summary>
    [Authorize(Roles = Roles.EditClients, AuthenticationSchemes = AuthCoreSchemes.Bearer)]
    [Route("api/[controller]")]
    [ResponseCache(NoStore = true)]
    public class ClientController
    {
        private readonly IClientRepository clientRepository;

        public static class Rels
        {
            public const String List = "listClients";
            public const String Add = "addClient";
            public const String Get = "getClient";
            public const String Update = "updateClient";
            public const String Delete = "deleteClient";
            public const String Secret = "addClientSecret";
            public const String LoadFromMetadata = "loadClientFromMetadata";
        }

        public ClientController(IClientRepository clientRepository)
        {
            this.clientRepository = clientRepository;
        }

        /// <summary>
        /// Get a list of all clients.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [HalRel(Rels.List)]
        public Task<ClientEditModelCollectionView> Get([FromQuery] ClientQuery query)
        {
            return clientRepository.Query(query);
        }

        /// <summary>
        /// Get a particular client.
        /// </summary>
        /// <returns></returns>
        [HttpGet("{Id}")]
        [HalRel(Rels.Get)]
        public Task<ClientEditModel> Get(int id)
        {
            return clientRepository.Get(id);
        }

        /// <summary>
        /// Create a new client.
        /// </summary>
        /// <param name="value">The info to use to create the client.</param>
        /// <returns>Created if the value was created.</returns>
        [HttpPost]
        [AutoValidate("Cannot add client.")]
        [ProducesResponseType(typeof(Object), (int)HttpStatusCode.Created)]
        [HalRel(Rels.Add)]
        public Task Post([FromBody] ClientInput value)
        {
            return clientRepository.Add(value);
        }

        /// <summary>
        /// Update or create a client.
        /// </summary>
        /// <param name="id">The id of the client to update.</param>
        /// <param name="value">The info to use to update the client.</param>
        /// <returns>Created if the value was created, Ok if it was updated.</returns>
        [HttpPut("{Id}")]
        [AutoValidate("Cannot update client.")]
        [ProducesResponseType(typeof(Object), (int)HttpStatusCode.Created)]
        [ProducesResponseType(typeof(Object), (int)HttpStatusCode.OK)]
        [HalRel(Rels.Update)]
        public Task Put(int id, [FromBody] ClientInput value)
        {
            return clientRepository.Update(id, value);
        }

        /// <summary>
        /// Delete a client.
        /// </summary>
        /// <param name="id">The id of the client to delete.</param>
        /// <returns>Ok if the client was deleted.</returns>
        [HttpDelete("{Id}")]
        [HalRel(Rels.Delete)]
        public Task Delete(int id)
        {
            return clientRepository.Delete(id);
        }

        /// <summary>
        /// Generate a new secret for the client app and return it.
        /// </summary>
        /// <param name="id">The id of the client to create a secret for.</param>
        /// <returns>The new secret string.</returns>
        [HttpPut("{Id}/[action]")]
        [HalRel(Rels.Secret)]
        public Task<CreateSecretResult> Secret(int id)
        {
            return clientRepository.CreateSecret(id);
        }

        /// <summary>
        /// Get the client metadata from targetUrl.
        /// </summary>
        /// <remarks>
        /// This is useful to have go through the server side so you don't have to deal with cors in client apps.
        /// </remarks>
        [HttpGet]
        [Route("[action]")]
        [HalRel(Rels.LoadFromMetadata)]
        public async Task<ClientMetadataView> FromMetadata([FromQuery] MetadataLookup lookupInfo, [FromServices] IMetadataClient client, [FromServices] IMapper mapper)
        {
            var metadataView = mapper.Map<ClientMetadataView>(await client.ClientAsync(lookupInfo.TargetUrl));
            return metadataView;
        }

        /// <summary>
        /// Get the client metadata from targetUrl.
        /// </summary>
        /// <remarks>
        /// This is useful to have go through the server side so you don't have to deal with cors in client apps.
        /// </remarks>
        [HttpGet]
        [Route("[action]")]
        [HalRel(nameof(FromClientCredentialsMetadata))]
        public async Task<ClientMetadataView> FromClientCredentialsMetadata([FromQuery] MetadataLookup lookupInfo, [FromServices] IMetadataClient client, [FromServices] IMapper mapper)
        {
            return mapper.Map<ClientMetadataView>(await client.ClientCredentialsAsync(lookupInfo.TargetUrl));
        }
    }
}

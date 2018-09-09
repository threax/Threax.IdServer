using AutoMapper;
using IdentityServer4.EntityFramework.Entities;
using IdentityServer4.EntityFramework.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Threax.AspNetCore.AuthCore;
using Threax.AspNetCore.ExceptionFilter;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.IdServerMetadata.Client;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Areas.Api.Models;

namespace Threax.IdServer.Areas.Api.Controllers
{
    /// <summary>
    /// Edit the client applications connected to this server.
    /// </summary>
    [Authorize(Roles = Roles.EditClients, AuthenticationSchemes = AuthCoreSchemes.Bearer)]
    [Route("[controller]")]
    [Area("Api")]
    [ResponseCache(NoStore = true)]
    public class ClientController : Controller
    {
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

        private IConfigurationDbContext configDb;
        private IMapper mapper;

        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="mapper">The mapper.</param>
        /// <param name="configDb">The configuration db context.</param>
        public ClientController(IConfigurationDbContext configDb, IMapper mapper)
        {
            this.configDb = configDb;
            this.mapper = mapper;
        }

        /// <summary>
        /// Get a list of all clients.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [HalRel(Rels.List)]
        public async Task<ClientEditModelCollectionView> Get([FromQuery] PagedCollectionQuery query)
        {
            //Don't want secrets here
            var clients = configDb.Clients
                                  .Include(i => i.AllowedGrantTypes)
                                  .Include(i => i.RedirectUris)
                                  .Include(i => i.AllowedScopes);

            int total = await clients.CountAsync();
            var results = clients.Skip(query.SkipTo(total)).Take(query.Limit);
            var items = await results.Select(c => mapper.Map<ClientEditModel>(c)).ToListAsync();

            return new ClientEditModelCollectionView(query, total, items);
        }

        /// <summary>
        /// Get a particular client.
        /// </summary>
        /// <returns></returns>
        [HttpGet("{Id}")]
        [HalRel(Rels.Get)]
        public async Task<ClientEditModel> Get(int id)
        {
            //Don't want secrets here
            var clients = configDb.Clients
                                  .Include(i => i.AllowedGrantTypes)
                                  .Include(i => i.RedirectUris)
                                  .Include(i => i.AllowedScopes)
                                  .Where(i => i.Id == id);
            var client = await clients.FirstOrDefaultAsync();
            return mapper.Map<ClientEditModel>(client);
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
        public async Task Post([FromBody] ClientInput value)
        {
            var entity = mapper.Map<Client>(value);

            //Any new client gets the secret notyetdefined
            if (value.AllowedGrantTypes.Contains("hybrid"))
            {
                entity.ClientSecrets = new List<ClientSecret>()
                {
                    new ClientSecret()
                    {
                        Client = entity,
                        Value = IdentityServer4.Models.HashExtensions.Sha256("notyetdefined"),
                    }
                };
            }

            configDb.Clients.Add(entity);
            await configDb.SaveChangesAsync();
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
        public async Task Put(int id, [FromBody] ClientInput value)
        {
            var client = await GetFullClientEntity(id);
            if (client != null)
            {
                mapper.Map<ClientInput, Client>(value, client);
                configDb.Clients.Update(client);
                await configDb.SaveChangesAsync();
            }
            else
            {
                await Post(value);
            }
        }

        /// <summary>
        /// Delete a client.
        /// </summary>
        /// <param name="id">The id of the client to delete.</param>
        /// <returns>Ok if the client was deleted.</returns>
        [HttpDelete("{Id}")]
        [HalRel(Rels.Delete)]
        public async Task Delete(int id)
        {
            var client = await GetFullClientEntity(id);
            if (client == null)
            {
                throw new ErrorResultException($"Cannot find a client to delete to with id {id}.");
            }
            configDb.Clients.Remove(client);
            await configDb.SaveChangesAsync();
        }

        /// <summary>
        /// Generate a new secret for the client app and return it.
        /// </summary>
        /// <param name="id">The id of the client to create a secret for.</param>
        /// <param name="numberGen">The random number generator to use to generate secrets.</param>
        /// <returns>The new secret string.</returns>
        [HttpPut("{Id}/[action]")]
        [HalRel(Rels.Secret)]
        public async Task<CreateSecretResult> Secret(int id, [FromServices] RandomNumberGenerator numberGen)
        {
            var client = await GetFullClientEntity(id);
            if (client == null)
            {
                throw new ErrorResultException($"Cannot find a client to add a secret to with id {id}.");
            }

            var bytes = new byte[32];
            numberGen.GetBytes(bytes);

            var secretString = Convert.ToBase64String(bytes);
            var secret = new IdentityServer4.Models.Secret(IdentityServer4.Models.HashExtensions.Sha256(secretString));
            client.ClientSecrets.Clear();
            client.ClientSecrets.Add(new ClientSecret()
            {
                Client = client,
                Value = secret.Value,
                Description = secret.Description,
                Expiration = secret.Expiration,
                Type = secret.Type
            });
            configDb.Clients.Update(client);
            await configDb.SaveChangesAsync();
            return new CreateSecretResult()
            {
                Secret = secretString
            };
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
        public async Task<ClientMetadataView> FromMetadata([FromQuery] MetadataLookup lookupInfo, [FromServices] MetadataClient client, [FromServices] IMapper mapper)
        {
            client.BaseUrl = lookupInfo.TargetUrl;
            return mapper.Map<ClientMetadataView>(await client.ClientAsync(null, this.HttpContext.User.GetAccessToken()));
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
        public async Task<ClientMetadataView> FromClientCredentialsMetadata([FromQuery] MetadataLookup lookupInfo, [FromServices] MetadataClient client, [FromServices] IMapper mapper)
        {
            client.BaseUrl = lookupInfo.TargetUrl;
            return mapper.Map<ClientMetadataView>(await client.ClientCredentialsAsync(null, this.HttpContext.User.GetAccessToken()));
        }

        private async Task<Client> GetFullClientEntity(int id)
        {
            var query = from c in configDb.Clients
                            .Include(i => i.AllowedGrantTypes)
                            .Include(i => i.RedirectUris)
                            .Include(i => i.AllowedScopes)
                            .Include(i => i.ClientSecrets)
                        where c.Id == id
                        select c;

            return await query.FirstOrDefaultAsync();
        }
    }
}

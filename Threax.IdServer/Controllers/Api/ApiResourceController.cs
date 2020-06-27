using AutoMapper;
using IdentityServer4.EntityFramework.Entities;
using IdentityServer4.EntityFramework.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Threax.AspNetCore.AuthCore;
using Threax.AspNetCore.ExceptionFilter;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.IdServerMetadata.Client;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Areas.Api.Models;
using Threax.IdServer.InputModels;

namespace Threax.IdServer.Areas.Api.Controllers
{
    /// <summary>
    /// Api for editing scopes
    /// </summary>
    [Authorize(Roles = Roles.EditApiResources, AuthenticationSchemes = AuthCoreSchemes.Bearer)]
    [Route("[controller]")]
    [Area("Api")]
    [ResponseCache(NoStore = true)]
    public class ApiResourceController : Controller
    {
        public static class Rels
        {
            public const String List = "listApiResource";
            public const String Add = "addApiResource";
            public const String Get = "getApiResource";
            public const String Update = "updateApiResource";
            public const String Delete = "deleteApiResource";
            public const String LoadFromMetadata = "loadApiResourceFromMetadata";
        }

        private IConfigurationDbContext configDb;
        private IMapper mapper;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="configDb">The configuration db to use to store scopes.</param>
        /// <param name="mapper">The mapper</param>
        public ApiResourceController(IConfigurationDbContext configDb, IMapper mapper)
        {
            this.configDb = configDb;
            this.mapper = mapper;
        }

        /// <summary>
        /// Get all scopes
        /// </summary>
        /// <returns>All the scopes</returns>
        [HttpGet]
        [HalRel(Rels.List)]
        public async Task<ApiResourceEditModelCollection> Get([FromQuery] ApiResourceQuery query)
        {
            if (query.Id != null)
            {
                var client = await Get(query.Id.Value);
                if (client == null)
                {
                    return new ApiResourceEditModelCollection(query, 0, Enumerable.Empty<ApiResourceEditModel>());
                }
                return new ApiResourceEditModelCollection(query, 1, new ApiResourceEditModel[] { client });
            }

            IQueryable<ApiResource> resources = configDb.ApiResources.Include(i => i.Scopes);

            if (!String.IsNullOrEmpty(query.Name))
            {
                resources = resources.Where(i => EF.Functions.Like(i.Name, $"%{query.Name}%"));
            }

            int total = await resources.CountAsync();
            resources = resources.OrderBy(i => i.Name);
            var results = resources.Skip(query.SkipTo(total)).Take(query.Limit);
            var items = (await results.Select(s => mapper.Map<ApiResourceEditModel>(s)).ToListAsync());

            return new ApiResourceEditModelCollection(query, total, items);
        }

        /// <summary>
        /// Get all scopes
        /// </summary>
        /// <returns>All the scopes</returns>
        [HttpGet("{Id}")]
        [HalRel(Rels.Get)]
        public async Task<ApiResourceEditModel> Get(int id)
        {
            var resources = configDb.ApiResources.Include(i => i.Scopes).Where(i => i.Id == id); //Don't send secrets back to client
            var resource = await resources.FirstOrDefaultAsync();
            return mapper.Map<ApiResourceEditModel>(resource);
        }

        /// <summary>
        /// Create a new client.
        /// </summary>
        /// <param name="value">The scope to add.</param>
        /// <returns>Created status if a new scope was created.</returns>
        [HttpPost]
        [AutoValidate("Cannot add scope.")]
        [ProducesResponseType(typeof(Object), (int)HttpStatusCode.Created)]
        [HalRel(Rels.Add)]
        public async Task Post([FromBody] ApiResourceInput value)
        {
            var resource = mapper.Map<ApiResource>(value);
            configDb.ApiResources.Add(resource);
            await configDb.SaveChangesAsync();
        }

        /// <summary>
        /// Update or create a scope.
        /// </summary>
        /// <param name="id">The id of the value to update.</param>
        /// <param name="value">The scope to update.</param>
        /// <returns></returns>
        [HttpPut("{Id}")]
        [AutoValidate("Cannot update scope.")]
        [ProducesResponseType(typeof(Object), (int)HttpStatusCode.Created)]
        [ProducesResponseType(typeof(Object), (int)HttpStatusCode.OK)]
        [HalRel(Rels.Update)]
        public async Task Put(int id, [FromBody] ApiResourceInput value)
        {
            var resource = await SelectFullEntity().Where(i => i.Id == id).FirstOrDefaultAsync();
            if (resource != null)
            {
                mapper.Map<ApiResourceInput, ApiResource>(value, resource);
                configDb.ApiResources.Update(resource);
                await configDb.SaveChangesAsync();
            }
            else
            {
                await Post(value);
            }
        }

        /// <summary>
        /// Delete a scope.
        /// </summary>
        /// <param name="id">The id of the scope to delete.</param>
        /// <returns>Ok if the scope is deleted.</returns>
        [HttpDelete("{Id}")]
        [HalRel(Rels.Delete)]
        public async Task Delete(int id)
        {
            var resource = await SelectFullEntity().Where(i => i.Id == id).FirstOrDefaultAsync();
            if (resource == null)
            {
                throw new ErrorResultException($"Cannot find an api resource to delete to with id {id}");
            }

            configDb.ApiResources.Remove(resource);
            await configDb.SaveChangesAsync();
        }

        /// <summary>
        /// Get the scope metadata from targetUrl.
        /// </summary>
        /// <remarks>
        /// This is useful to have go through the server side so you don't have to deal with cors for the id server in scope apps.
        /// </remarks>
        [HttpGet]
        [Route("[action]")]
        [HalRel(Rels.LoadFromMetadata)]
        public async Task<ApiResourceMetadataView> FromMetadata([FromQuery] MetadataLookup lookupInfo, [FromServices] MetadataClient client, [FromServices] IMapper mapper)
        {
            client.BaseUrl = lookupInfo.GetFixedTargetUrl();
            return mapper.Map<ApiResourceMetadataView>(await client.ScopeAsync(null, this.HttpContext.User.GetAccessToken()));
        }

        /// <summary>
        /// Get the full entity. This includes the secrets, so don't send to the client this way.
        /// </summary>
        /// <returns></returns>
        private IQueryable<ApiResource> SelectFullEntity()
        {
            return configDb.ApiResources.Include(i => i.Scopes).Include(i => i.Secrets).Include(i => i.Scopes);
        }
    }
}

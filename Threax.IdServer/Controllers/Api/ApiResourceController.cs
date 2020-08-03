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
using Threax.IdServer.Repository;

namespace Threax.IdServer.Areas.Api.Controllers
{
    /// <summary>
    /// Api for editing scopes
    /// </summary>
    [Authorize(Roles = Roles.EditApiResources, AuthenticationSchemes = AuthCoreSchemes.Bearer)]
    [Route("api/[controller]")]
    [ResponseCache(NoStore = true)]
    public class ApiResourceController
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

        private readonly IApiResourceRepository apiResourceRepository;

        public ApiResourceController(IApiResourceRepository apiResourceRepository)
        {
            this.apiResourceRepository = apiResourceRepository;
        }

        /// <summary>
        /// Get all scopes
        /// </summary>
        /// <returns>All the scopes</returns>
        [HttpGet]
        [HalRel(Rels.List)]
        public Task<ApiResourceEditModelCollection> Get([FromQuery] ApiResourceQuery query)
        {
            return this.apiResourceRepository.Query(query);
        }

        /// <summary>
        /// Get all scopes
        /// </summary>
        /// <returns>All the scopes</returns>
        [HttpGet("{Id}")]
        [HalRel(Rels.Get)]
        public Task<ApiResourceEditModel> Get(int id)
        {
            return apiResourceRepository.Get(id);
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
        public Task Post([FromBody] ApiResourceInput value)
        {
            return apiResourceRepository.Add(value);
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
        public Task Put(int id, [FromBody] ApiResourceInput value)
        {
            return apiResourceRepository.Update(id, value);
        }

        /// <summary>
        /// Delete a scope.
        /// </summary>
        /// <param name="id">The id of the scope to delete.</param>
        /// <returns>Ok if the scope is deleted.</returns>
        [HttpDelete("{Id}")]
        [HalRel(Rels.Delete)]
        public Task Delete(int id)
        {
            return apiResourceRepository.Delete(id);
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
        public async Task<ApiResourceMetadataView> FromMetadata([FromQuery] MetadataLookup lookupInfo, [FromServices] IMetadataClient client, [FromServices] IMapper mapper)
        {
            return mapper.Map<ApiResourceMetadataView>(await client.ScopeAsync(lookupInfo.TargetUrl));
        }
    }
}

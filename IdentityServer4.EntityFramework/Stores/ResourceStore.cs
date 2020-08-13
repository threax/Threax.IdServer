// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.


using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IdentityServer4.EntityFramework.Interfaces;
using IdentityServer4.Models;
using IdentityServer4.Stores;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IdentityServer4.EntityFramework.Stores
{
    /// <summary>
    /// Implementation of IResourceStore thats uses EF.
    /// </summary>
    /// <seealso cref="IdentityServer4.Stores.IResourceStore" />
    public class ResourceStore : IResourceStore
    {
        /// <summary>
        /// The DbContext.
        /// </summary>
        protected readonly IConfigurationDbContext Context;

        /// <summary>
        /// The logger.
        /// </summary>
        protected readonly ILogger<ResourceStore> Logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="ResourceStore"/> class.
        /// </summary>
        /// <param name="context">The context.</param>
        /// <param name="logger">The logger.</param>
        /// <exception cref="ArgumentNullException">context</exception>
        public ResourceStore(IConfigurationDbContext context, ILogger<ResourceStore> logger)
        {
            Context = context ?? throw new ArgumentNullException(nameof(context));
            Logger = logger;
        }

        /// <summary>
        /// Finds the API resources by name.
        /// </summary>
        /// <param name="apiResourceNames">The names.</param>
        /// <returns></returns>
        public Task<IEnumerable<ApiResource>> FindApiResourcesByNameAsync(IEnumerable<string> apiResourceNames)
        {
            //Return everything incoming as an api resource
            IEnumerable<ApiResource> result = Context.Scopes.Where(i => apiResourceNames.Contains(i.Name)).Select(i => new ApiResource(i.Name, i.DisplayName));
            return Task.FromResult(result);
        }

        /// <summary>
        /// Gets API resources by scope name.
        /// </summary>
        /// <param name="scopeNames"></param>
        /// <returns></returns>
        public Task<IEnumerable<ApiResource>> FindApiResourcesByScopeNameAsync(IEnumerable<string> scopeNames)
        {
            //Return everything incoming thats in the scopes table as an api resource
            IEnumerable<ApiResource> result = Context.Scopes.Where(i => scopeNames.Contains(i.Name)).Select(i => new ApiResource(i.Name, i.DisplayName)
            {
                Scopes = new List<String> { i.Name }
            });
            return Task.FromResult(result);
        }

        /// <summary>
        /// Gets identity resources by scope name.
        /// </summary>
        /// <param name="scopeNames"></param>
        /// <returns></returns>
        public Task<IEnumerable<IdentityResource>> FindIdentityResourcesByScopeNameAsync(IEnumerable<string> scopeNames)
        {
            IEnumerable<IdentityResource> result = CreateIdentityResources();
            return Task.FromResult(result);
        }

        /// <summary>
        /// Gets scopes by scope name.
        /// </summary>
        /// <param name="scopeNames"></param>
        /// <returns></returns>
        public async Task<IEnumerable<ApiScope>> FindApiScopesByNameAsync(IEnumerable<string> scopeNames)
        {
            IEnumerable<ApiScope> result = await Context.Scopes.Where(i => scopeNames.Contains(i.Name)).Select(i => new ApiScope(i.Name, i.DisplayName)).AsNoTracking().ToListAsync();
            return result;
        }

        /// <summary>
        /// Gets all resources.
        /// </summary>
        /// <returns></returns>
        public async Task<Resources> GetAllResourcesAsync()
        {
            List<IdentityResource> identityResources = CreateIdentityResources();

            var apiResources = Enumerable.Empty<ApiResource>();

            var apiScopes = await Context.Scopes.Select(i => new ApiScope(i.Name, i.DisplayName)).AsNoTracking().ToListAsync();

            return new Resources(identityResources, apiResources, apiScopes);
        }

        private static List<IdentityResource> CreateIdentityResources()
        {
            return new List<IdentityResource>()
            {
                new IdentityResources.Address(),
                new IdentityResources.Email(),
                new IdentityResources.OpenId(),
                new IdentityResources.Phone(),
                new IdentityResources.Profile()
            };
        }
    }
}
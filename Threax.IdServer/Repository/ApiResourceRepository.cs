﻿using AutoMapper;
using IdentityServer4.EntityFramework.Entities;
using IdentityServer4.EntityFramework.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Areas.Api.Models;
using Threax.IdServer.InputModels;

namespace Threax.IdServer.Repository
{
    public class ApiResourceRepository : IApiResourceRepository
    {
        private IConfigurationDbContext configDb;
        private IMapper mapper;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="configDb">The configuration db to use to store scopes.</param>
        /// <param name="mapper">The mapper</param>
        public ApiResourceRepository(IConfigurationDbContext configDb, IMapper mapper)
        {
            this.configDb = configDb;
            this.mapper = mapper;
        }

        public async Task<ApiResourceEditModelCollection> Query(ApiResourceQuery query)
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

        public async Task<ApiResourceEditModel> Get(int id)
        {
            var resources = configDb.ApiResources.Include(i => i.Scopes).Where(i => i.Id == id); //Don't send secrets back to client
            var resource = await resources.FirstOrDefaultAsync();
            return mapper.Map<ApiResourceEditModel>(resource);
        }

        public async Task Add(ApiResourceInput value)
        {
            var resource = mapper.Map<ApiResource>(value);
            configDb.ApiResources.Add(resource);
            await configDb.SaveChangesAsync();
        }

        public async Task Update(int id, ApiResourceInput value)
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
                await Add(value);
            }
        }

        public async Task AddOrUpdate(ApiResourceInput value)
        {
            var resource = mapper.Map<ApiResource>(value);
            var existing = await configDb.ApiResources.Where(i => i.Name == value.ScopeName).FirstOrDefaultAsync();
            if (existing == null)
            {
                await Add(value);
            }
            else
            {
                await Update(existing.Id, value);
            }
        }

        public async Task Delete(int id)
        {
            var resource = await SelectFullEntity().Where(i => i.Id == id).FirstOrDefaultAsync();
            if (resource == null)
            {
                throw new InvalidOperationException($"Cannot find an api resource to delete to with id {id}");
            }

            configDb.ApiResources.Remove(resource);
            await configDb.SaveChangesAsync();
        }

        private IQueryable<ApiResource> SelectFullEntity()
        {
            return configDb.ApiResources.Include(i => i.Scopes).Include(i => i.Secrets).Include(i => i.Scopes);
        }
    }
}
// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.


using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IdentityServer4.EntityFramework.Interfaces;
using IdentityServer4.Models;
using IdentityServer4.Stores;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System;
using IdentityServer4.EntityFramework.Mappers;

namespace IdentityServer4.EntityFramework.Stores
{
    /// <summary>
    /// Implementation of IPersistedGrantStore thats uses EF.
    /// </summary>
    /// <seealso cref="IdentityServer4.Stores.IPersistedGrantStore" />
    public class PersistedGrantStore : IPersistedGrantStore
    {
        private readonly IPersistedGrantDbContext _context;
        private readonly ILogger _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="PersistedGrantStore"/> class.
        /// </summary>
        /// <param name="context">The context.</param>
        /// <param name="logger">The logger.</param>
        public PersistedGrantStore(IPersistedGrantDbContext context, ILogger<PersistedGrantStore> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Stores the asynchronous.
        /// </summary>
        /// <param name="token">The token.</param>
        /// <returns></returns>
        public Task StoreAsync(PersistedGrant token)
        {
            var existing = _context.PersistedGrants.SingleOrDefault(x => x.Key == token.Key);
            if (existing == null)
            {
                _logger.LogDebug("{persistedGrantKey} not found in database", token.Key);

                var persistedGrant = token.ToEntity();
                _context.PersistedGrants.Add(persistedGrant);
            }
            else
            {
                _logger.LogDebug("{persistedGrantKey} found in database", token.Key);

                token.UpdateEntity(existing);
            }

            try
            {
                _context.SaveChanges();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning("exception updating {persistedGrantKey} persisted grant in database: {error}", token.Key, ex.Message);
            }

            return Task.FromResult(0);
        }

        /// <summary>
        /// Gets the grant.
        /// </summary>
        /// <param name="key">The key.</param>
        /// <returns></returns>
        public Task<PersistedGrant> GetAsync(string key)
        {
            var persistedGrant = _context.PersistedGrants.FirstOrDefault(x => x.Key == key);
            var model = persistedGrant?.ToModel();

            _logger.LogDebug("{persistedGrantKey} found in database: {persistedGrantKeyFound}", key, model != null);

            return Task.FromResult(model);
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<PersistedGrant>> GetAllAsync(PersistedGrantFilter filter)
        {
            var persistedGrants = await Filter(_context.PersistedGrants.AsQueryable(), filter).ToArrayAsync();
            persistedGrants = Filter(persistedGrants.AsQueryable(), filter).ToArray();

            var model = persistedGrants.Select(x => x.ToModel());

            _logger.LogDebug("{persistedGrantCount} persisted grants found for {@filter}", persistedGrants.Length, filter);

            return model;
        }

        /// <summary>
        /// Removes the grant by key.
        /// </summary>
        /// <param name="key">The key.</param>
        /// <returns></returns>
        public Task RemoveAsync(string key)
        {
            var persistedGrant = _context.PersistedGrants.FirstOrDefault(x => x.Key == key);
            if (persistedGrant!= null)
            {
                _logger.LogDebug("removing {persistedGrantKey} persisted grant from database", key);

                _context.PersistedGrants.Remove(persistedGrant);

                try
                {
                    _context.SaveChanges();
                }
                catch(DbUpdateConcurrencyException ex)
                {
                    _logger.LogInformation("exception removing {persistedGrantKey} persisted grant from database: {error}", key, ex.Message);
                }
            }
            else
            {
                _logger.LogDebug("no {persistedGrantKey} persisted grant found in database", key);
            }

            return Task.FromResult(0);
        }

        /// <summary>
        /// Removes all grants for a given subject id and client id combination.
        /// </summary>
        /// <param name="subjectId">The subject identifier.</param>
        /// <param name="clientId">The client identifier.</param>
        /// <returns></returns>
        public Task RemoveAllAsync(string subjectId, string clientId)
        {
            var persistedGrants = _context.PersistedGrants.Where(x => x.SubjectId == subjectId && x.ClientId == clientId).ToList();

            _logger.LogDebug("removing {persistedGrantCount} persisted grants from database for subject {subjectId}, clientId {clientId}", persistedGrants.Count, subjectId, clientId);

            _context.PersistedGrants.RemoveRange(persistedGrants);

            try
            {
                _context.SaveChanges();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogInformation("removing {persistedGrantCount} persisted grants from database for subject {subjectId}, clientId {clientId}: {error}", persistedGrants.Count, subjectId, clientId, ex.Message);
            }

            return Task.FromResult(0);
        }

        /// <inheritdoc/>
        public async Task RemoveAllAsync(PersistedGrantFilter filter)
        {
            var persistedGrants = await Filter(_context.PersistedGrants.AsQueryable(), filter).ToArrayAsync();
            persistedGrants = Filter(persistedGrants.AsQueryable(), filter).ToArray();

            _logger.LogDebug("removing {persistedGrantCount} persisted grants from database for {@filter}", persistedGrants.Length, filter);

            _context.PersistedGrants.RemoveRange(persistedGrants);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogInformation("removing {persistedGrantCount} persisted grants from database for subject {@filter}: {error}", persistedGrants.Length, filter, ex.Message);
            }
        }


        private IQueryable<Entities.PersistedGrant> Filter(IQueryable<Entities.PersistedGrant> query, PersistedGrantFilter filter)
        {
            if (!String.IsNullOrWhiteSpace(filter.ClientId))
            {
                query = query.Where(x => x.ClientId == filter.ClientId);
            }
            //if (!String.IsNullOrWhiteSpace(filter.SessionId))
            //{
            //    query = query.Where(x => x.SessionId == filter.SessionId);
            //}
            if (!String.IsNullOrWhiteSpace(filter.SubjectId))
            {
                query = query.Where(x => x.SubjectId == filter.SubjectId);
            }
            if (!String.IsNullOrWhiteSpace(filter.Type))
            {
                query = query.Where(x => x.Type == filter.Type);
            }

            return query;
        }
    }
}
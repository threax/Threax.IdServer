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
    /// Implementation of IClientStore thats uses EF.
    /// </summary>
    /// <seealso cref="IdentityServer4.Stores.IClientStore" />
    public class ClientStore : IClientStore
    {
        private readonly IConfigurationDbContext _context;
        private readonly ILogger<ClientStore> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="ClientStore"/> class.
        /// </summary>
        /// <param name="context">The context.</param>
        /// <param name="logger">The logger.</param>
        /// <exception cref="ArgumentNullException">context</exception>
        public ClientStore(IConfigurationDbContext context, ILogger<ClientStore> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger;
        }

        /// <summary>
        /// Finds a client by id
        /// </summary>
        /// <param name="clientId">The client id</param>
        /// <returns>
        /// The client
        /// </returns>
        public async Task<Client> FindClientByIdAsync(string clientId)
        {
            var i = (await _context.Clients.Where(i => i.ClientId == clientId)
                .Include(i => i.AllowedScopes)
                .Include(i => i.ClientSecrets)
                .Include(i => i.RedirectUris)
                .FirstOrDefaultAsync()) ?? throw new InvalidOperationException($"Cannot find client '{clientId}'.");

            var allowedGrantTypes = new List<String>();
            if((i.AllowedGrantTypes & Entities.GrantTypes.AuthorizationCode) == Entities.GrantTypes.AuthorizationCode)
            {
                allowedGrantTypes.Add("authorization_code");
            }
            if ((i.AllowedGrantTypes & Entities.GrantTypes.Hybrid) == Entities.GrantTypes.Hybrid)
            {
                allowedGrantTypes.Add("hybrid");
            }
            if ((i.AllowedGrantTypes & Entities.GrantTypes.ClientCredentials) == Entities.GrantTypes.ClientCredentials)
            {
                allowedGrantTypes.Add("client_credentials");
            }

            return new Client()
            {
                AccessTokenLifetime = i.AccessTokenLifetime,
                AllowedGrantTypes = allowedGrantTypes,
                AllowedScopes = i.AllowedScopes.Select(i => i.Scope).ToList(),
                ClientId = i.ClientId,
                ClientSecrets = i.ClientSecrets.Select(i => new Secret(i.Secret)).ToList(),
                EnableLocalLogin = i.EnableLocalLogin,
                BackChannelLogoutSessionRequired = i.LogoutSessionRequired,
                BackChannelLogoutUri = i.LogoutUri,
                FrontChannelLogoutUri = i.LogoutUri,
                ClientName = i.Name,
                RedirectUris = i.RedirectUris.Select(i => i.Uri).ToList(),

                //Hardcoded
                RequireConsent = false,
                AllowRememberConsent = true,
                FrontChannelLogoutSessionRequired = true,
                AllowOfflineAccess = true,
                RequirePkce = false //Probably want this, but not enabled historically
            };
        }
    }
}
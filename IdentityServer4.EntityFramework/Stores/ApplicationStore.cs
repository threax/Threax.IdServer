﻿using IdentityServer4.EntityFramework.DbContexts;
using IdentityServer4.EntityFramework.Entities;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace IdentityServer4.EntityFramework.Stores
{

    class ApplicationStoreResolver : IOpenIddictApplicationStoreResolver
    {
        private readonly IServiceProvider provider;

        public ApplicationStoreResolver(IServiceProvider provider)
        {
            this.provider = provider;
        }

        IOpenIddictApplicationStore<TApplication> IOpenIddictApplicationStoreResolver.Get<TApplication>()
        {
            return provider.GetService(typeof(ApplicationStore)) as IOpenIddictApplicationStore<TApplication>;
        }
    }

    class ApplicationStore : IOpenIddictApplicationStore<Client>
    {
        private readonly ConfigurationDbContext dbContext;

        public ApplicationStore(ConfigurationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async ValueTask<long> CountAsync(CancellationToken cancellationToken)
        {
            return await dbContext.Clients.AsNoTracking().CountAsync(cancellationToken);
        }

        public async ValueTask<long> CountAsync<TResult>(Func<IQueryable<Client>, IQueryable<TResult>> query, CancellationToken cancellationToken)
        {
            return await query(dbContext.Clients.AsNoTracking()).CountAsync(cancellationToken);
        }

        public async ValueTask CreateAsync(Client application, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask DeleteAsync(Client application, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask<Client> FindByClientIdAsync(string identifier, CancellationToken cancellationToken)
        {
            return await dbContext.Clients
                .AsNoTracking()
                .Where(i => i.ClientId == identifier)
                .FirstAsync(cancellationToken);
        }

        public async ValueTask<Client> FindByIdAsync(string identifier, CancellationToken cancellationToken)
        {
            int parsedId = int.Parse(identifier);
            return await dbContext.Clients
                .AsNoTracking()
                .Where(i => i.Id == parsedId)
                .FirstAsync(cancellationToken);
        }

        public IAsyncEnumerable<Client> FindByPostLogoutRedirectUriAsync(string address, CancellationToken cancellationToken)
        {
            return dbContext.Clients
                .AsNoTracking()
                .Where(i => i.LogoutUri == address)
                .AsAsyncEnumerable();
        }

        public IAsyncEnumerable<Client> FindByRedirectUriAsync(string address, CancellationToken cancellationToken)
        {
            return dbContext.Clients
                .AsNoTracking()
                .Where(i => i.RedirectUris.Any(i => i.Uri == address))
                .AsAsyncEnumerable();
        }

        public async ValueTask<TResult> GetAsync<TState, TResult>(Func<IQueryable<Client>, TState, IQueryable<TResult>> query, TState state, CancellationToken cancellationToken)
        {
            return await query(dbContext.Clients.AsNoTracking(), state).FirstOrDefaultAsync(cancellationToken);
        }

        public async ValueTask<string> GetClientIdAsync(Client application, CancellationToken cancellationToken)
        {
            return application.ClientId;
        }

        public async ValueTask<string> GetClientSecretAsync(Client application, CancellationToken cancellationToken)
        {
            var secret = await dbContext.ClientSecrets
                .AsNoTracking()
                .Where(i => i.ClientId == application.Id)
                .Select(i => i.Secret)
                .FirstAsync(cancellationToken);

            return secret;
        }

        public async ValueTask<string> GetClientTypeAsync(Client application, CancellationToken cancellationToken)
        {
            return ClientTypes.Public;
        }

        public async ValueTask<string> GetConsentTypeAsync(Client application, CancellationToken cancellationToken)
        {
            return ConsentTypes.Implicit;
        }

        public async ValueTask<string> GetDisplayNameAsync(Client application, CancellationToken cancellationToken)
        {
            return application.Name;
        }

        public ValueTask<ImmutableDictionary<CultureInfo, string>> GetDisplayNamesAsync(Client application, CancellationToken cancellationToken)
        {
            var builder = ImmutableDictionary.CreateBuilder<CultureInfo, string>();
            builder[CultureInfo.CurrentCulture] = application.Name;
            return ValueTask.FromResult(builder.ToImmutable());
        }

        public async ValueTask<string> GetIdAsync(Client application, CancellationToken cancellationToken)
        {
            return application.Id.ToString();
        }

        public async ValueTask<ImmutableArray<string>> GetPermissionsAsync(Client application, CancellationToken cancellationToken)
        {
            var result = await dbContext.AllowedScopes
                        .AsNoTracking()
                        .Where(i => i.ClientId == application.Id)
                        .Select(i => Permissions.Prefixes.Scope + i.Scope)
                        .ToListAsync(cancellationToken);

            //application.AllowedGrantTypes == Entities.GrantTypes.
            //Handle grant types here
            
            result.AddRange(new String[] { 
                Permissions.Endpoints.Authorization, 
                Permissions.GrantTypes.AuthorizationCode, 
                Permissions.GrantTypes.Implicit, 
                Permissions.GrantTypes.RefreshToken,
                Permissions.ResponseTypes.CodeIdToken
            });

            return result.ToImmutableArray();
        }

        public ValueTask<ImmutableArray<string>> GetPostLogoutRedirectUrisAsync(Client application, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(new string[] { application.LogoutUri }.ToImmutableArray());
        }

        public ValueTask<ImmutableDictionary<string, JsonElement>> GetPropertiesAsync(Client application, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(ImmutableDictionary.Create<string, JsonElement>());
        }

        public async ValueTask<ImmutableArray<string>> GetRedirectUrisAsync(Client application, CancellationToken cancellationToken)
        {
            var result = await dbContext.RedirectUris
                .AsNoTracking()
                .Where(i => i.ClientId == application.Id)
                .Select(i => i.Uri)
                .ToListAsync(cancellationToken);

                return result.ToImmutableArray();
        }

        public ValueTask<ImmutableArray<string>> GetRequirementsAsync(Client application, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(Array.Empty<string>().ToImmutableArray());
        }

        public ValueTask<Client> InstantiateAsync(CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(new Client());
        }

        public IAsyncEnumerable<Client> ListAsync(int? count, int? offset, CancellationToken cancellationToken)
        {
            IQueryable<Client> query = dbContext.Clients.AsNoTracking();
            if(offset != null)
            {
                query = query.Skip(offset.Value);
            }
            if(count != null)
            {
                query = query.Take(count.Value);
            }
            return query.AsAsyncEnumerable();
        }

        public IAsyncEnumerable<TResult> ListAsync<TState, TResult>(Func<IQueryable<Client>, TState, IQueryable<TResult>> query, TState state, CancellationToken cancellationToken)
        {
            return query(dbContext.Clients.AsNoTracking(), state).AsAsyncEnumerable();
        }

        public async ValueTask SetClientIdAsync(Client application, string identifier, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask SetClientSecretAsync(Client application, string secret, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask SetClientTypeAsync(Client application, string type, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask SetConsentTypeAsync(Client application, string type, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask SetDisplayNameAsync(Client application, string name, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask SetDisplayNamesAsync(Client application, ImmutableDictionary<CultureInfo, string> names, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask SetPermissionsAsync(Client application, ImmutableArray<string> permissions, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask SetPostLogoutRedirectUrisAsync(Client application, ImmutableArray<string> addresses, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask SetPropertiesAsync(Client application, ImmutableDictionary<string, JsonElement> properties, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask SetRedirectUrisAsync(Client application, ImmutableArray<string> addresses, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask SetRequirementsAsync(Client application, ImmutableArray<string> requirements, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask UpdateAsync(Client application, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}

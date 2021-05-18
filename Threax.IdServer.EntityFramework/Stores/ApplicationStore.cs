using IdentityServer4.EntityFramework.DbContexts;
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

        public ValueTask CreateAsync(Client application, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask DeleteAsync(Client application, CancellationToken cancellationToken)
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

        public ValueTask<string> GetClientIdAsync(Client application, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(application.ClientId);
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

        public ValueTask<string> GetClientTypeAsync(Client application, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(ClientTypes.Confidential);
        }

        public ValueTask<string> GetConsentTypeAsync(Client application, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(ConsentTypes.Implicit);
        }

        public ValueTask<string> GetDisplayNameAsync(Client application, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(application.Name);
        }

        public ValueTask<ImmutableDictionary<CultureInfo, string>> GetDisplayNamesAsync(Client application, CancellationToken cancellationToken)
        {
            var builder = ImmutableDictionary.CreateBuilder<CultureInfo, string>();
            builder[CultureInfo.CurrentCulture] = application.Name;
            return ValueTask.FromResult(builder.ToImmutable());
        }

        public ValueTask<string> GetIdAsync(Client application, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(application.Id.ToString());
        }

        public async ValueTask<ImmutableArray<string>> GetPermissionsAsync(Client application, CancellationToken cancellationToken)
        {
            var result = await dbContext.AllowedScopes
                        .AsNoTracking()
                        .Where(i => i.ClientId == application.Id)
                        .Select(i => Permissions.Prefixes.Scope + i.Scope)
                        .ToListAsync(cancellationToken);

            //Set permissions based on grant types.
            var otherPermissions = new HashSet<string>();
            if ((application.AllowedGrantTypes & Entities.GrantTypes.Hybrid) == Entities.GrantTypes.Hybrid
                || (application.AllowedGrantTypes & Entities.GrantTypes.AuthorizationCode) == Entities.GrantTypes.AuthorizationCode)
            {
                //Apps login users with hybrid flow
                otherPermissions.Add(Permissions.Endpoints.Authorization);
                otherPermissions.Add(Permissions.Endpoints.Token);
                otherPermissions.Add(Permissions.Endpoints.Logout);
                otherPermissions.Add(Permissions.GrantTypes.AuthorizationCode);
                otherPermissions.Add(Permissions.GrantTypes.Implicit);
                otherPermissions.Add(Permissions.GrantTypes.RefreshToken);
                otherPermissions.Add(Permissions.ResponseTypes.CodeIdToken);
            }
            if ((application.AllowedGrantTypes & Entities.GrantTypes.ClientCredentials) == Entities.GrantTypes.ClientCredentials)
            {
                //Will need something here when client creds start logging in.
                otherPermissions.Add(Permissions.Endpoints.Token);
                otherPermissions.Add(Permissions.GrantTypes.ClientCredentials);
            }

            result.AddRange(otherPermissions);

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

        public ValueTask SetClientIdAsync(Client application, string identifier, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetClientSecretAsync(Client application, string secret, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetClientTypeAsync(Client application, string type, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetConsentTypeAsync(Client application, string type, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetDisplayNameAsync(Client application, string name, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetDisplayNamesAsync(Client application, ImmutableDictionary<CultureInfo, string> names, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetPermissionsAsync(Client application, ImmutableArray<string> permissions, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetPostLogoutRedirectUrisAsync(Client application, ImmutableArray<string> addresses, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetPropertiesAsync(Client application, ImmutableDictionary<string, JsonElement> properties, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetRedirectUrisAsync(Client application, ImmutableArray<string> addresses, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetRequirementsAsync(Client application, ImmutableArray<string> requirements, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask UpdateAsync(Client application, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}

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

namespace IdentityServer4.EntityFramework.Stores
{
    class ScopeStore : IOpenIddictScopeStore<Scope>
    {
        private readonly ConfigurationDbContext configurationDbContext;

        public ScopeStore(ConfigurationDbContext configurationDbContext)
        {
            this.configurationDbContext = configurationDbContext;
        }

        public async ValueTask<long> CountAsync(CancellationToken cancellationToken)
        {
            return await configurationDbContext.Scopes.CountAsync();
        }

        public async ValueTask<long> CountAsync<TResult>(Func<IQueryable<Scope>, IQueryable<TResult>> query, CancellationToken cancellationToken)
        {
            return await query(configurationDbContext.Scopes).CountAsync(cancellationToken);
        }

        public ValueTask CreateAsync(Scope scope, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask DeleteAsync(Scope scope, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async ValueTask<Scope> FindByIdAsync(string identifier, CancellationToken cancellationToken)
        {
            var intId = int.Parse(identifier);
            return await configurationDbContext.Scopes.Where(i => i.Id == intId).FirstAsync(cancellationToken);
        }

        public async ValueTask<Scope> FindByNameAsync(string name, CancellationToken cancellationToken)
        {
            return await configurationDbContext.Scopes.Where(i => i.Name == name).FirstAsync(cancellationToken);
        }

        public IAsyncEnumerable<Scope> FindByNamesAsync(ImmutableArray<string> names, CancellationToken cancellationToken)
        {
            return configurationDbContext.Scopes.Where(i => names.Contains(i.Name)).AsAsyncEnumerable();
        }

        public IAsyncEnumerable<Scope> FindByResourceAsync(string resource, CancellationToken cancellationToken)
        {
            return configurationDbContext.Scopes.Where(i => i.Name == resource).AsAsyncEnumerable();
        }

        public async ValueTask<TResult> GetAsync<TState, TResult>(Func<IQueryable<Scope>, TState, IQueryable<TResult>> query, TState state, CancellationToken cancellationToken)
        {
            return await query(configurationDbContext.Scopes, state).FirstOrDefaultAsync(cancellationToken);
        }

        public ValueTask<string> GetDescriptionAsync(Scope scope, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(scope.DisplayName);
        }

        public ValueTask<ImmutableDictionary<CultureInfo, string>> GetDescriptionsAsync(Scope scope, CancellationToken cancellationToken)
        {
            var builder = ImmutableDictionary.CreateBuilder<CultureInfo, string>();
            builder[CultureInfo.CurrentCulture] = scope.DisplayName;
            return ValueTask.FromResult(builder.ToImmutable());
        }

        public ValueTask<string> GetDisplayNameAsync(Scope scope, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(scope.DisplayName);
        }

        public ValueTask<ImmutableDictionary<CultureInfo, string>> GetDisplayNamesAsync(Scope scope, CancellationToken cancellationToken)
        {
            var builder = ImmutableDictionary.CreateBuilder<CultureInfo, string>();
            builder[CultureInfo.CurrentCulture] = scope.DisplayName;
            return ValueTask.FromResult(builder.ToImmutable());
        }

        public ValueTask<string> GetIdAsync(Scope scope, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(scope.Id.ToString());
        }

        public ValueTask<string> GetNameAsync(Scope scope, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(scope.Name);
        }

        public ValueTask<ImmutableDictionary<string, JsonElement>> GetPropertiesAsync(Scope scope, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(ImmutableDictionary.Create<string, JsonElement>());
        }

        public ValueTask<ImmutableArray<string>> GetResourcesAsync(Scope scope, CancellationToken cancellationToken)
        {
            var arr = new String[] { scope.Name }.ToImmutableArray();
            return ValueTask.FromResult(arr);
        }

        public ValueTask<Scope> InstantiateAsync(CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(new Scope());
        }

        public IAsyncEnumerable<Scope> ListAsync(int? count, int? offset, CancellationToken cancellationToken)
        {
            IQueryable<Scope> query = configurationDbContext.Scopes;
            if (offset != null)
            {
                query.Skip(offset.Value);
            }
            if (count != null)
            {
                query.Take(count.Value);
            }
            return query.AsAsyncEnumerable();
        }

        public IAsyncEnumerable<TResult> ListAsync<TState, TResult>(Func<IQueryable<Scope>, TState, IQueryable<TResult>> query, TState state, CancellationToken cancellationToken)
        {
            return query(configurationDbContext.Scopes, state).AsAsyncEnumerable();
        }

        public ValueTask SetDescriptionAsync(Scope scope, string description, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetDescriptionsAsync(Scope scope, ImmutableDictionary<CultureInfo, string> descriptions, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetDisplayNameAsync(Scope scope, string name, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetDisplayNamesAsync(Scope scope, ImmutableDictionary<CultureInfo, string> names, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetNameAsync(Scope scope, string name, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetPropertiesAsync(Scope scope, ImmutableDictionary<string, JsonElement> properties, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask SetResourcesAsync(Scope scope, ImmutableArray<string> resources, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public ValueTask UpdateAsync(Scope scope, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}

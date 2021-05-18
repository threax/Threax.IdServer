using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using OpenIddict.Abstractions;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Threax.IdServer.EntityFramework.DbContexts;
using Threax.IdServer.EntityFramework.Entities;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Threax.IdServer.EntityFramework.Stores
{
    class AuthorizationStoreResolver : IOpenIddictAuthorizationStoreResolver
    {
        private readonly IServiceProvider provider;

        public AuthorizationStoreResolver(IServiceProvider provider)
        {
            this.provider = provider;
        }

        IOpenIddictAuthorizationStore<TAuthorization> IOpenIddictAuthorizationStoreResolver.Get<TAuthorization>()
        {
            return provider.GetService(typeof(AuthorizationStore)) as IOpenIddictAuthorizationStore<TAuthorization>;
        }
    }

    class AuthorizationStore : IOpenIddictAuthorizationStore<Authorization>
    {
        private readonly OperationDbContext dbContext;

        public AuthorizationStore(OperationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async ValueTask<long> CountAsync(CancellationToken cancellationToken)
        {
            return await dbContext.Authorizations.AsNoTracking().CountAsync();
        }

        public async ValueTask<long> CountAsync<TResult>(Func<IQueryable<Authorization>, IQueryable<TResult>> query, CancellationToken cancellationToken)
        {
            return await query(dbContext.Authorizations.AsNoTracking()).CountAsync(cancellationToken);
        }

        public async ValueTask CreateAsync(Authorization authorization, CancellationToken cancellationToken)
        {
            dbContext.Authorizations.Add(authorization);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        public async ValueTask DeleteAsync(Authorization authorization, CancellationToken cancellationToken)
        {
            var auth = await dbContext.Authorizations.Where(i => i.AuthorizationId == authorization.AuthorizationId).FirstAsync();
            dbContext.Authorizations.Remove(auth);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        public IAsyncEnumerable<Authorization> FindAsync(string subject, string client, CancellationToken cancellationToken)
        {
            return dbContext.Authorizations
                .AsNoTracking()
                .Where(i => i.Subject == subject && i.Client == client)
                .AsAsyncEnumerable();
        }

        public IAsyncEnumerable<Authorization> FindAsync(string subject, string client, string status, CancellationToken cancellationToken)
        {
            return dbContext.Authorizations
                .AsNoTracking()
                .Where(i => i.Subject == subject && i.Client == client && i.Status == status)
                .AsAsyncEnumerable();
        }

        public IAsyncEnumerable<Authorization> FindAsync(string subject, string client, string status, string type, CancellationToken cancellationToken)
        {
            return dbContext.Authorizations
                .AsNoTracking()
                .Where(i => i.Subject == subject && i.Client == client && i.Status == status && i.Type == type)
                .AsAsyncEnumerable();
        }

        public async IAsyncEnumerable<Authorization> FindAsync(string subject, string client, string status, string type, ImmutableArray<string> scopes, CancellationToken cancellationToken)
        {
            var authorizations = dbContext.Authorizations
                .AsNoTracking()
                .Where(i => i.Subject == subject && i.Client == client && i.Status == status && i.Type == type)
                .AsAsyncEnumerable();

            await foreach (var authorization in authorizations)
            {
                if (new HashSet<string>(await GetScopesAsync(authorization, cancellationToken), StringComparer.Ordinal).IsSupersetOf(scopes))
                {
                    yield return authorization;
                }
            }
        }

        public IAsyncEnumerable<Authorization> FindByApplicationIdAsync(string identifier, CancellationToken cancellationToken)
        {
            var appId = int.Parse(identifier);
            return dbContext.Authorizations
                .AsNoTracking()
                .Where(i => i.ApplicationId == appId)
                .AsAsyncEnumerable();
        }

        public async ValueTask<Authorization> FindByIdAsync(string identifier, CancellationToken cancellationToken)
        {
            var id = Guid.Parse(identifier);
            return await dbContext.Authorizations
                .AsNoTracking()
                .Where(i => i.AuthorizationId == id)
                .FirstAsync();
        }

        public IAsyncEnumerable<Authorization> FindBySubjectAsync(string subject, CancellationToken cancellationToken)
        {
            return dbContext.Authorizations
                .AsNoTracking()
                .Where(i => i.Subject == subject)
                .AsAsyncEnumerable();
        }

        public ValueTask<string> GetApplicationIdAsync(Authorization authorization, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(authorization.ApplicationId.ToString());
        }

        public async ValueTask<TResult> GetAsync<TState, TResult>(Func<IQueryable<Authorization>, TState, IQueryable<TResult>> query, TState state, CancellationToken cancellationToken)
        {
            return await query(dbContext.Authorizations.AsNoTracking(), state).FirstAsync(cancellationToken);
        }

        public ValueTask<DateTimeOffset?> GetCreationDateAsync(Authorization authorization, CancellationToken cancellationToken)
        {
            DateTimeOffset? result = null;
            if(authorization.Created != null)
            {
                result = DateTime.SpecifyKind(authorization.Created.Value, DateTimeKind.Utc);
            }

            return ValueTask.FromResult<DateTimeOffset?>(result);
        }

        public ValueTask<string> GetIdAsync(Authorization authorization, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(authorization.AuthorizationId.ToString());
        }

        public ValueTask<ImmutableDictionary<string, JsonElement>> GetPropertiesAsync(Authorization authorization, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(ImmutableDictionary.Create<string, JsonElement>());
        }

        public ValueTask<ImmutableArray<string>> GetScopesAsync(Authorization authorization, CancellationToken cancellationToken)
        {
            var scopes = JsonSerializer.Deserialize<List<string>>(authorization.ScopesJson);
            return ValueTask.FromResult(scopes.ToImmutableArray());
        }

        public ValueTask<string> GetStatusAsync(Authorization authorization, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(authorization.Status);
        }

        public ValueTask<string> GetSubjectAsync(Authorization authorization, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(authorization.Subject);
        }

        public ValueTask<string> GetTypeAsync(Authorization authorization, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(authorization.Type);
        }

        public ValueTask<Authorization> InstantiateAsync(CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(new Authorization());
        }

        public IAsyncEnumerable<Authorization> ListAsync(int? count, int? offset, CancellationToken cancellationToken)
        {
            IQueryable<Authorization> query = dbContext.Authorizations.AsNoTracking();
            if (offset != null)
            {
                query = query.Skip(offset.Value);
            }
            if (count != null)
            {
                query = query.Take(count.Value);
            }
            return query.AsAsyncEnumerable();
        }

        public IAsyncEnumerable<TResult> ListAsync<TState, TResult>(Func<IQueryable<Authorization>, TState, IQueryable<TResult>> query, TState state, CancellationToken cancellationToken)
        {
            return query(dbContext.Authorizations.AsNoTracking(), state).AsAsyncEnumerable();
        }

        public async ValueTask PruneAsync(DateTimeOffset threshold, CancellationToken cancellationToken)
        {
            //From OpenIddict OpenIddictEntityFrameworkCoreAuthorizationStore.cs

            // Note: Entity Framework Core doesn't support set-based deletes, which prevents removing
            // entities in a single command without having to retrieve and materialize them first.
            // To work around this limitation, entities are manually listed and deleted using a batch logic.

            List<Exception> exceptions = null;

            async ValueTask<IDbContextTransaction> CreateTransactionAsync()
            {
                // Note: transactions that specify an explicit isolation level are only supported by
                // relational providers and trying to use them with a different provider results in
                // an invalid operation exception being thrown at runtime. To prevent that, a manual
                // check is made to ensure the underlying transaction manager is relational.
                var manager = dbContext.Database.GetService<IDbContextTransactionManager>();
                if (manager is IRelationalTransactionManager)
                {
                    // Note: relational providers like Sqlite are known to lack proper support
                    // for repeatable read transactions. To ensure this method can be safely used
                    // with such providers, the database transaction is created in a try/catch block.
                    try
                    {
                        return await dbContext.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead, cancellationToken);
                    }

                    catch
                    {
                        return null;
                    }
                }

                return null;
            }

            // Note: to avoid sending too many queries, the maximum number of elements
            // that can be removed by a single call to PruneAsync() is deliberately limited.
            for (var index = 0; index < 1_000; index++)
            {
                cancellationToken.ThrowIfCancellationRequested();

                // To prevent concurrency exceptions from being thrown if an entry is modified
                // after it was retrieved from the database, the following logic is executed in
                // a repeatable read transaction, that will put a lock on the retrieved entries
                // and thus prevent them from being concurrently modified outside this block.
                using var transaction = await CreateTransactionAsync();

                // Note: the Oracle MySQL provider doesn't support DateTimeOffset and is unable
                // to create a SQL query with an expression calling DateTimeOffset.UtcDateTime.
                // To work around this limitation, the threshold represented as a DateTimeOffset
                // instance is manually converted to a UTC DateTime instance outside the query.
                var date = threshold.UtcDateTime;

                var authorizations =
                    await(from authorization in dbContext.Authorizations.Include(authorization => authorization.Tokens).AsTracking()
                          where authorization.Created < date
                          where authorization.Status != Statuses.Valid ||
                               (authorization.Type == AuthorizationTypes.AdHoc && !authorization.Tokens.Any())
                          orderby authorization.AuthorizationId
                          select authorization).Take(1_000).ToListAsync(cancellationToken);

                if (authorizations.Count == 0)
                {
                    break;
                }

                // Note: new tokens may be attached after the authorizations were retrieved
                // from the database since the transaction level is deliberately limited to
                // repeatable read instead of serializable for performance reasons). In this
                // case, the operation will fail, which is considered an acceptable risk.
                dbContext.RemoveRange(authorizations);

                try
                {
                    await dbContext.SaveChangesAsync(cancellationToken);
                    transaction?.Commit();
                }

                catch (Exception exception)
                {
                    exceptions ??= new List<Exception>(capacity: 1);
                    exceptions.Add(exception);
                }
            }

            if (exceptions is not null)
            {
                throw new AggregateException("Exceptions occured pruning results", exceptions);
            }
        }

        public ValueTask SetApplicationIdAsync(Authorization authorization, string identifier, CancellationToken cancellationToken)
        {
            authorization.ApplicationId = int.Parse(identifier);
            return ValueTask.CompletedTask;
        }

        public ValueTask SetCreationDateAsync(Authorization authorization, DateTimeOffset? date, CancellationToken cancellationToken)
        {
            authorization.Created = date?.UtcDateTime;
            return ValueTask.CompletedTask;
        }

        public ValueTask SetPropertiesAsync(Authorization authorization, ImmutableDictionary<string, JsonElement> properties, CancellationToken cancellationToken)
        {
            return ValueTask.CompletedTask;
        }

        public ValueTask SetScopesAsync(Authorization authorization, ImmutableArray<string> scopes, CancellationToken cancellationToken)
        {
            authorization.ScopesJson = JsonSerializer.Serialize(scopes);
            return ValueTask.CompletedTask;
        }

        public ValueTask SetStatusAsync(Authorization authorization, string status, CancellationToken cancellationToken)
        {
            authorization.Status = status;
            return ValueTask.CompletedTask;
        }

        public ValueTask SetSubjectAsync(Authorization authorization, string subject, CancellationToken cancellationToken)
        {
            authorization.Subject = subject;
            return ValueTask.CompletedTask;
        }

        public ValueTask SetTypeAsync(Authorization authorization, string type, CancellationToken cancellationToken)
        {
            authorization.Type = type;
            return ValueTask.CompletedTask;
        }

        public async ValueTask UpdateAsync(Authorization authorization, CancellationToken cancellationToken)
        {
            var currentAuth = await dbContext.Authorizations.Where(i => i.AuthorizationId == authorization.AuthorizationId).FirstAsync();
            authorization.CopyTo(currentAuth);
            await dbContext.SaveChangesAsync();
        }
    }
}

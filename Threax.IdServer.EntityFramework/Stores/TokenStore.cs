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
    class TokenStoreResolver : IOpenIddictTokenStoreResolver
    {
        private readonly IServiceProvider provider;

        public TokenStoreResolver(IServiceProvider provider)
        {
            this.provider = provider;
        }

        IOpenIddictTokenStore<TToken> IOpenIddictTokenStoreResolver.Get<TToken>()
        {
            return provider.GetService(typeof(TokenStore)) as IOpenIddictTokenStore<TToken>;
        }
    }

    class TokenStore : IOpenIddictTokenStore<Token>
    {
        private readonly OperationDbContext dbContext;

        public TokenStore(OperationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async ValueTask<long> CountAsync(CancellationToken cancellationToken)
        {
            return await dbContext.Authorizations.AsNoTracking().CountAsync();
        }

        public async ValueTask<long> CountAsync<TResult>(Func<IQueryable<Token>, IQueryable<TResult>> query, CancellationToken cancellationToken)
        {
            return await query(dbContext.Tokens.AsNoTracking()).CountAsync(cancellationToken);
        }

        public async ValueTask CreateAsync(Token token, CancellationToken cancellationToken)
        {
            dbContext.Tokens.Add(token);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        public async ValueTask DeleteAsync(Token token, CancellationToken cancellationToken)
        {
            var auth = await dbContext.Tokens.Where(i => i.TokenId == token.TokenId).FirstAsync();
            dbContext.Tokens.Remove(auth);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        public IAsyncEnumerable<Token> FindAsync(string subject, string client, CancellationToken cancellationToken)
        {
            return dbContext.Tokens
                .AsNoTracking()
                .Where(i => i.Subject == subject && i.Authorization.Client == client)
                .AsAsyncEnumerable();
        }

        public IAsyncEnumerable<Token> FindAsync(string subject, string client, string status, CancellationToken cancellationToken)
        {
            return dbContext.Tokens
                .AsNoTracking()
                .Where(i => i.Subject == subject && i.Authorization.Client == client && i.Status == status)
                .AsAsyncEnumerable();
        }

        public IAsyncEnumerable<Token> FindAsync(string subject, string client, string status, string type, CancellationToken cancellationToken)
        {
            return dbContext.Tokens
                .AsNoTracking()
                .Where(i => i.Subject == subject && i.Authorization.Client == client && i.Status == status && i.Type == type)
                .AsAsyncEnumerable();
        }

        public IAsyncEnumerable<Token> FindByApplicationIdAsync(string identifier, CancellationToken cancellationToken)
        {
            var parsed = int.Parse(identifier);
            return dbContext.Tokens
                .AsNoTracking()
                .Where(i => i.ApplicationId == parsed)
                .AsAsyncEnumerable();
        }

        public IAsyncEnumerable<Token> FindByAuthorizationIdAsync(string identifier, CancellationToken cancellationToken)
        {
            var parsed = Guid.Parse(identifier);
            return dbContext.Tokens
                .AsNoTracking()
                .Where(i => i.AuthorizationId == parsed)
                .AsAsyncEnumerable();
        }

        public async ValueTask<Token> FindByIdAsync(string identifier, CancellationToken cancellationToken)
        {
            var parsed = Guid.Parse(identifier);
            return await dbContext.Tokens
                .AsNoTracking()
                .Where(i => i.TokenId == parsed)
                .FirstAsync();
        }

        public async ValueTask<Token> FindByReferenceIdAsync(string identifier, CancellationToken cancellationToken)
        {
            var result = await dbContext.Tokens
                .AsNoTracking()
                .Where(i => i.ReferenceId == identifier)
                .FirstOrDefaultAsync();

            if(result == null)
            {
                //The db may not have written the changes yet, so check the local store
                result = dbContext.ChangeTracker.Entries<Token>()
                    .Where(i => i.Entity.ReferenceId == identifier)
                    .Select(i => i.Entity)
                    .FirstOrDefault();

                if(result == null)
                {
                    throw new KeyNotFoundException("Cannot find token for identifier.");
                }
            }

            return result;
        }

        public IAsyncEnumerable<Token> FindBySubjectAsync(string subject, CancellationToken cancellationToken)
        {
            return dbContext.Tokens
                .AsNoTracking()
                .Where(i => i.Subject == subject)
                .AsAsyncEnumerable();
        }

        public ValueTask<string> GetApplicationIdAsync(Token token, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(token.ApplicationId.ToString());
        }

        public async ValueTask<TResult> GetAsync<TState, TResult>(Func<IQueryable<Token>, TState, IQueryable<TResult>> query, TState state, CancellationToken cancellationToken)
        {
            return await query(dbContext.Tokens.AsNoTracking(), state).FirstAsync();
        }

        public ValueTask<string> GetAuthorizationIdAsync(Token token, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(token.AuthorizationId.ToString());
        }

        public ValueTask<DateTimeOffset?> GetCreationDateAsync(Token token, CancellationToken cancellationToken)
        {
            DateTimeOffset? result = null;
            if (token.Created != null)
            {
                result = DateTime.SpecifyKind(token.Created.Value, DateTimeKind.Utc);
            }

            return ValueTask.FromResult<DateTimeOffset?>(result);
        }

        public ValueTask<DateTimeOffset?> GetExpirationDateAsync(Token token, CancellationToken cancellationToken)
        {
            DateTimeOffset? result = null;
            if (token.Expires != null)
            {
                result = DateTime.SpecifyKind(token.Expires.Value, DateTimeKind.Utc);
            }

            return ValueTask.FromResult<DateTimeOffset?>(result);
        }

        public ValueTask<string> GetIdAsync(Token token, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(token.TokenId.ToString());
        }

        public ValueTask<string> GetPayloadAsync(Token token, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(token.Payload);
        }

        public ValueTask<ImmutableDictionary<string, JsonElement>> GetPropertiesAsync(Token token, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(ImmutableDictionary.Create<string, JsonElement>());
        }

        public ValueTask<DateTimeOffset?> GetRedemptionDateAsync(Token token, CancellationToken cancellationToken)
        {
            DateTimeOffset? result = null;
            if (token.RedemptionDate != null)
            {
                result = DateTime.SpecifyKind(token.RedemptionDate.Value, DateTimeKind.Utc);
            }

            return ValueTask.FromResult<DateTimeOffset?>(result);
        }

        public ValueTask<string> GetReferenceIdAsync(Token token, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(token.ReferenceId);
        }

        public ValueTask<string> GetStatusAsync(Token token, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(token.Status);
        }

        public ValueTask<string> GetSubjectAsync(Token token, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(token.Subject);
        }

        public ValueTask<string> GetTypeAsync(Token token, CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(token.Type);
        }

        public ValueTask<Token> InstantiateAsync(CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(new Token());
        }

        public IAsyncEnumerable<Token> ListAsync(int? count, int? offset, CancellationToken cancellationToken)
        {
            IQueryable<Token> query = dbContext.Tokens.AsNoTracking();
            if (offset.HasValue)
            {
                query = query.Skip(offset.Value);
            }

            if (count.HasValue)
            {
                query = query.Take(count.Value);
            }

            return query.AsAsyncEnumerable();
        }

        public IAsyncEnumerable<TResult> ListAsync<TState, TResult>(Func<IQueryable<Token>, TState, IQueryable<TResult>> query, TState state, CancellationToken cancellationToken)
        {
            return query(dbContext.Tokens.AsNoTracking(), state).AsAsyncEnumerable();
        }

        public async ValueTask PruneAsync(DateTimeOffset threshold, CancellationToken cancellationToken)
        {
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

                var tokens = await
                    (from token in dbContext.Tokens.AsNoTracking()
                     where token.Created < date
                     where (token.Status != Statuses.Inactive && token.Status != Statuses.Valid) ||
                           (token.Authorization != null && token.Authorization.Status != Statuses.Valid) ||
                            token.Expires < DateTime.UtcNow
                     orderby token.TokenId
                     select token).Take(1_000).ToListAsync(cancellationToken);

                if (tokens.Count == 0)
                {
                    break;
                }

                dbContext.RemoveRange(tokens);

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
                throw new AggregateException("Exception pruning tokens", exceptions);
            }
        }

        public ValueTask SetApplicationIdAsync(Token token, string identifier, CancellationToken cancellationToken)
        {
            token.ApplicationId = int.Parse(identifier);
            return ValueTask.CompletedTask;
        }

        public ValueTask SetAuthorizationIdAsync(Token token, string identifier, CancellationToken cancellationToken)
        {
            token.AuthorizationId = identifier != null ? Guid.Parse(identifier) : null;
            return ValueTask.CompletedTask;
        }

        public ValueTask SetCreationDateAsync(Token token, DateTimeOffset? date, CancellationToken cancellationToken)
        {
            token.Created = date?.UtcDateTime;
            return ValueTask.CompletedTask;
        }

        public ValueTask SetExpirationDateAsync(Token token, DateTimeOffset? date, CancellationToken cancellationToken)
        {
            token.Expires = date?.UtcDateTime;
            return ValueTask.CompletedTask;
        }

        public ValueTask SetPayloadAsync(Token token, string payload, CancellationToken cancellationToken)
        {
            token.Payload = payload;
            return ValueTask.CompletedTask;
        }

        public ValueTask SetPropertiesAsync(Token token, ImmutableDictionary<string, JsonElement> properties, CancellationToken cancellationToken)
        {
            return ValueTask.CompletedTask;
        }

        public ValueTask SetRedemptionDateAsync(Token token, DateTimeOffset? date, CancellationToken cancellationToken)
        {
            token.RedemptionDate = date?.UtcDateTime;
            return ValueTask.CompletedTask;
        }

        public ValueTask SetReferenceIdAsync(Token token, string identifier, CancellationToken cancellationToken)
        {
            token.ReferenceId = identifier;
            return ValueTask.CompletedTask;
        }

        public ValueTask SetStatusAsync(Token token, string status, CancellationToken cancellationToken)
        {
            token.Status = status;
            return ValueTask.CompletedTask;
        }

        public ValueTask SetSubjectAsync(Token token, string subject, CancellationToken cancellationToken)
        {
            token.Subject = subject;
            return ValueTask.CompletedTask;
        }

        public ValueTask SetTypeAsync(Token token, string type, CancellationToken cancellationToken)
        {
            token.Type = type;
            return ValueTask.CompletedTask;
        }

        public async ValueTask UpdateAsync(Token token, CancellationToken cancellationToken)
        {
            var currentAuth = await dbContext.Tokens.Where(i => i.TokenId == token.TokenId).FirstAsync();
            token.CopyTo(currentAuth);
            await dbContext.SaveChangesAsync();
        }
    }
}

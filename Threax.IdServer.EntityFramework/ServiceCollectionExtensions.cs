using IdentityServer4.EntityFramework.DbContexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class ServiceCollectionExtensions
    {
        public static async Task PurgeOperationDb(this IServiceScope scope)
        {
            //This is not great code
            var grantsDb = scope.ServiceProvider.GetRequiredService<OperationDbContext>();
            grantsDb.Authorizations.RemoveRange(grantsDb.Authorizations);
            grantsDb.Tokens.RemoveRange(grantsDb.Tokens);
            await grantsDb.SaveChangesAsync();
        }
    }
}

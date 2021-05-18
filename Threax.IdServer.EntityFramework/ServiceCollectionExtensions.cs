using System.Threading.Tasks;
using Threax.IdServer.EntityFramework.DbContexts;

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

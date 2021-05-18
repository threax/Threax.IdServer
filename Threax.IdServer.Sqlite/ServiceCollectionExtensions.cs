using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using System;
using Threax.Sqlite.Ext;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class ServiceCollectionExtensions
    {
        public static DbContextOptionsBuilder UseConnectedDb(this DbContextOptionsBuilder options, String connectionString)
        {
            SqliteFileExtensions.TryCreateFile(connectionString);

            options.UseSqlite(connectionString, o =>
            {
                o.MigrationsAssembly(typeof(ServiceCollectionExtensions).Assembly.GetName().Name);
            });

            return options;
        }
    }
}

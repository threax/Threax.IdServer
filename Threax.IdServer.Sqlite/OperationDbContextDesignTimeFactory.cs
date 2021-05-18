using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Threax.IdServer.EntityFramework.DbContexts;

namespace Threax.IdServer.Sqlite
{
    public class OperationDbContextDesignTimeFactory : IDesignTimeDbContextFactory<OperationDbContext>
    {
        public OperationDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<OperationDbContext>();
            optionsBuilder.UseConnectedDb("ConnectionString");

            return new OperationDbContext(optionsBuilder.Options);
        }
    }
}

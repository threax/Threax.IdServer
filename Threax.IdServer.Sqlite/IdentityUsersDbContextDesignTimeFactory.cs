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
    public class IdentityUsersDbContextDesignTimeFactory : IDesignTimeDbContextFactory<IdentityUsersDbContext>
    {
        public IdentityUsersDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<IdentityUsersDbContext>();
            optionsBuilder.UseConnectedDb("ConnectionString");

            return new IdentityUsersDbContext(optionsBuilder.Options);
        }
    }
}

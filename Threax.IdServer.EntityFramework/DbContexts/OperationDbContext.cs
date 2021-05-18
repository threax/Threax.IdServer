using Microsoft.EntityFrameworkCore;
using Threax.IdServer.EntityFramework.Entities;

namespace Threax.IdServer.EntityFramework.DbContexts
{
    public class OperationDbContext : DbContext
    {
        public OperationDbContext(DbContextOptions<OperationDbContext> options)
            : base(options)
        {

        }

        public DbSet<Authorization> Authorizations { get; set; }

        public DbSet<Token> Tokens { get; set; }
    }
}

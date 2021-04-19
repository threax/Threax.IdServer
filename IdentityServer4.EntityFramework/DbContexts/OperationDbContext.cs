using IdentityServer4.EntityFramework.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer4.EntityFramework.DbContexts
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

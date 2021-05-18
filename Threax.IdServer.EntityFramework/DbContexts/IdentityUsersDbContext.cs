using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Threax.IdServer.EntityFramework.Entities;

namespace Threax.IdServer.EntityFramework.DbContexts
{
    public class IdentityUsersDbContext : IdentityDbContext<ApplicationUser>
    {
        public IdentityUsersDbContext(DbContextOptions<IdentityUsersDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema(AppDbContext.SchemaName);
        }
    }
}

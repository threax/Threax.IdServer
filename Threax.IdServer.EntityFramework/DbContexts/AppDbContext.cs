using Microsoft.EntityFrameworkCore;
using System;
using Threax.AspNetCore.UserBuilder.Entities;

namespace Threax.IdServer.EntityFramework.DbContexts
{
    /// <summary>
    /// By default the app db context extends the UsersDbContext from Authorization. 
    /// This gives it the Users, Roles and UsersToRoles tables.
    /// </summary>
    public class AppDbContext : UsersDbContext
    {
        public const String Schema = "id";

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema(AppDbContext.Schema);
        }
    }
}

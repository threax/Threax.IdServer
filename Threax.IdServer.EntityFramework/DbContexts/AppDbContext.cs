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
        public static string SchemaName { get; set; } = "dbo"; //Keep this here, it is needed during ef tools runs
                                                               //After creating a migration replace "dbo" with AppDbContext.SchemaName

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema(AppDbContext.SchemaName);
        }
    }
}

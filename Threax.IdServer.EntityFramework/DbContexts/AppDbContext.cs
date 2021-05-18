using Microsoft.EntityFrameworkCore;
using System;

namespace Threax.IdServer.EntityFramework.DbContexts
{
    /// <summary>
    /// By default the app db context extends the UsersDbContext from Authorization. 
    /// This gives it the Users, Roles and UsersToRoles tables.
    /// </summary>
    public class AppDbContext : Threax.AspNetCore.UserBuilder.Entities.UsersDbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
    }
}

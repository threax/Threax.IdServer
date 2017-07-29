using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace TestApi.Database
{
    /// <summary>
    /// By default the app db context extends the UsersDbContext from Authorization. 
    /// This gives it the Users, Roles and UsersToRoles tables.
    /// </summary>
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        //This is the values table in the database, you will probably want to delete it.
        //If you made a migration with these in there you can delete it or ignore it and move
        //forward, whatever works. This is here since it was decided that it was better to have
        //the template use real examples instead of placeholders.
        //See the Entity Framework Core documentation for more info on setting up a db context
        //https://docs.microsoft.com/en-us/ef/core/
        public DbSet<ValueEntity> Values {get; set;}
    }
}

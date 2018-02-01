using Microsoft.EntityFrameworkCore;
using System;
using Threax.AspNetCore.Models;
using Threax.AspNetCore.UserBuilder.Entities;

namespace Threax.IdServer.Data
{
    /// <summary>
    /// By default the app db context extends the UsersDbContext from Authorization. 
    /// This gives it the Users, Roles and UsersToRoles tables.
    /// </summary>
    public partial class AppDbContext : Threax.AspNetCore.UserBuilder.Entities.UsersDbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        //The dbset declarations are in the other parial classes. Expand the AppDbContext.cs class node to see them.
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}

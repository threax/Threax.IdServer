using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Threax.AspNetCore.BuiltInTools;
using Threax.AspNetCore.UserBuilder.Entities;
using Threax.IdServer.EntityFramework.DbContexts;

namespace Threax.IdServer.EntityFramework
{
    public static class AppDatabaseServiceExtensions
    {
        /// <summary>
        /// Setup mappings, this is separate so it can be called by a unit test without
        /// spinning up the whole system. No need to call manually unless needed in a unit test.
        /// </summary>
        /// <returns></returns>
        public static MapperConfiguration SetupMappings()
        {
            //Setup mappings between your objects here
            //Check out the AutoMapper docs for more info
            //https://github.com/AutoMapper/AutoMapper/wiki
            var mapperConfig = new MapperConfiguration(cfg =>
            {
                //Auto find profile classes
                var profiles = typeof(AppDatabaseServiceExtensions).GetTypeInfo().Assembly.GetTypes()
                    .Where(t => t.IsSubclassOf(typeof(Profile)))
                    .Select(i => Activator.CreateInstance(i) as Profile)
                    .ToList();

                cfg.AddProfiles(profiles);
            });

            return mapperConfig;
        }

        /// <summary>
        /// Setup the app database, will also setup repositories and mappings.
        /// </summary>
        /// <param name="services">The service collection.</param>
        /// <param name="connectionString">The connection string for the database.</param>
        /// <param name="schema">The name to set for the db schema.</param>
        /// <returns></returns>
        public static IServiceCollection UseAppDatabase(this IServiceCollection services, string connectionString, string schema)
        {
            AppDbContext.SchemaName = schema;

            //Add the database
            services.AddAuthorizationDatabase<AppDbContext>()
                .AddDbContext<AppDbContext>(o =>
                {
                    o.UseConnectedDb(connectionString);
                });

            return services;
        }

        /// <summary>
        /// Run the migrate tool.
        /// </summary>
        /// <param name="toolArgs">The tools args.</param>
        public static Task Migrate(this ToolArgs toolArgs)
        {
            var context = toolArgs.Scope.ServiceProvider.GetRequiredService<AppDbContext>();
            return context.Database.MigrateAsync();
        }

        public static Task MigrateUserDb(this ToolArgs toolArgs)
        {
            var context = toolArgs.Scope.ServiceProvider.GetRequiredService<IdentityUsersDbContext>();
            return context.Database.MigrateAsync();
        }

        public static Task MigrateConfigurationDb(this ToolArgs toolArgs)
        {
            var context = toolArgs.Scope.ServiceProvider.GetRequiredService<ConfigurationDbContext>();
            return context.Database.MigrateAsync();
        }

        public static Task MigrateOperationDb(this ToolArgs toolArgs)
        {
            var context = toolArgs.Scope.ServiceProvider.GetRequiredService<OperationDbContext>();
            return context.Database.MigrateAsync();
        }

        /// <summary>
        /// Seed the id server database with fresh data.
        /// </summary>
        /// <param name="scope">The scope to use.</param>
        public static void SeedIdServerDatabase(this IServiceScope scope)
        {
            var configContext = scope.ServiceProvider.GetRequiredService<ConfigurationDbContext>();

            //Uncomment to force db to reload
            //configContext.Clients.RemoveRange(configContext.Clients);
            //configContext.ApiResources.RemoveRange(configContext.ApiResources);
            //configContext.SaveChanges();

            if (!configContext.Scopes.Any())
            {
                var idServerScope = new Threax.IdServer.EntityFramework.Entities.Scope()
                {
                    Name = "Threax.IdServer",
                    DisplayName = "Identity Server",
                };
                configContext.Scopes.Add(idServerScope);

                configContext.SaveChanges();
            }
        }

        /// <summary>
        /// Run the seed tool, this should check to make sure that it is safe to apply the seed data.
        /// This means that the seed tool should make sure tables are empty before modifying them
        /// or otherwise leave existing data in the database alone.
        /// </summary>
        /// <param name="toolArgs">The tools args.</param>
        public static async Task Seed(this ToolArgs toolArgs)
        {
            //Seed the authorization database, this will automatically manage roles and will add
            //any roles not currently in the database.
            var context = toolArgs.Scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await context.SeedAuthorizationDatabase(Roles.DatabaseRoles());

            //Seed any additional data, it is best to keep this operation safe even if there
            //is data in the database, the easiest way to do this for most tables is to just
            //check to see if there is anything in there already, and if there is, do nothing.
        }

        /// <summary>
        /// Add a user as an "admin" this means they get all the roles.
        /// </summary>
        /// <param name="toolArgs">The tools args.</param>
        public static Task AddAdmin(this ToolArgs toolArgs)
        {
            if (toolArgs.Args.Count == 0)
            {
                throw new ToolException("Must add user guids as args to the addadmin tool.");
            }

            var repo = toolArgs.Scope.ServiceProvider.GetRequiredService<IUserEntityRepository>();
            return repo.AddAdmins(toolArgs.Args.Select(i => new User()
            {
                UserId = Guid.Parse(i),
                Name = $"AddAdmin {i}"
            }), Roles.DatabaseRoles());
        }
    }
}

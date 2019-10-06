using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Threax.AspNetCore.BuiltInTools;
using Threax.AspNetCore.Models;
using Threax.AspNetCore.UserBuilder.Entities;
using Threax.Sqlite.Ext;

namespace Threax.IdServer.Data
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
        /// <returns></returns>
        public static IServiceCollection UseAppDatabase(this IServiceCollection services, string connectionString)
        {
            SqliteFileExtensions.TryCreateFile(connectionString);

            TryCreateFile(connectionString);

            //Add the database
            services.AddAuthorizationDatabase<AppDbContext>()
                .AddDbContext<AppDbContext>(o =>
                {
                    o.UseSqlite(connectionString);
                });

            //Setup the mapper
            var mapperConfig = SetupMappings();
            services.AddScoped<IMapper>(s => mapperConfig.CreateMapper(s.GetRequiredService));

            //Setup repositories
            services.ConfigureReflectedServices(typeof(AppDatabaseServiceExtensions).GetTypeInfo().Assembly);

            return services;
        }

        private static String DataSourceStart = "Data Source=";
        private static char DataSourceEnd = ';';

        private static void TryCreateFile(string connectionString)
        {
            if (connectionString.StartsWith(DataSourceStart) && connectionString.EndsWith(DataSourceEnd))
            {
                var file = connectionString.Substring(DataSourceStart.Length);
                file = file.TrimEnd(DataSourceEnd);
                file = Path.GetFullPath(file);
                if (!File.Exists(file))
                {
                    var dir = Path.GetDirectoryName(file);
                    if (!Directory.Exists(dir))
                    {
                        Directory.CreateDirectory(dir);
                    }
                    File.Create(file);
                }
            }
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
            var context = toolArgs.Scope.ServiceProvider.GetRequiredService<UsersDbContext>();
            return context.Database.MigrateAsync();
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

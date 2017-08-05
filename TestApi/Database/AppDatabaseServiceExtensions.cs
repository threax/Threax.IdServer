using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TestApi.InputModels;
using TestApi.Repository;
using TestApi.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Threax.AspNetCore.BuiltInTools;
using Threax.AspNetCore.Models;

namespace TestApi.Database
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
                //Map the input model to the entity
                cfg.CreateMap<ValueInput, ValueEntity>()
                    .ForMember(d => d.ValueId, opt => opt.Ignore());

                //Map the entity to the view model.
                cfg.CreateMap<ValueEntity, Value>();

                cfg.SetupReflectedMappings(typeof(Startup).GetTypeInfo().Assembly);
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
            //Add the database
            services.AddDbContext<AppDbContext>(o =>
            {
                o.UseSqlServer(connectionString);
            });

            //Setup the mapper
            var mapperConfig = SetupMappings();
            services.AddScoped<IMapper>(i => mapperConfig.CreateMapper());

            //Setup repositories
            services.AddScoped<IValueRepository, ValueRepository>();

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

            //Seed any additional data, it is best to keep this operation safe even if there
            //is data in the database, the easiest way to do this for most tables is to just
            //check to see if there is anything in there already, and if there is, do nothing.

            //Here we seed some values if there aren't any yet.
            var valueRepo = toolArgs.Scope.ServiceProvider.GetRequiredService<IValueRepository>();
            if (!await valueRepo.HasValues())
            {
                await valueRepo.AddRange(ValueCreator());
            }
        }

        /// <summary>
        /// Helper function to generate values for seeding the database.
        /// </summary>
        /// <returns></returns>
        private static IEnumerable<ValueInput> ValueCreator()
        {
            for(var i = 0; i < 250; ++i)
            {
                yield return new ValueInput()
                {
                    Name = "Value " + i
                };
            }
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

            return Task.FromResult(0);
        }
    }
}

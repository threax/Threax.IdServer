using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Threax.AspNetCore.BuiltInTools;
using Threax.AspNetCore.Halcyon.ClientGen;
using System.Reflection;
using Threax.AspNetCore.Halcyon.Ext;
using TestApi.Database;
using TestApi.Controllers;
using Threax.AspNetCore.CorsManager;
using System.IO;
using Threax.AspNetCore.Models;

namespace TestApi
{
    public class Startup
    {
        //Replace the following values with your own values
        private const String Scope = "NewScope"; //Should match scope in the client
        private const String DisplayName = "New Service"; //Change this to a pretty name for the client
        //End user replace

        private AppConfig appConfig = new AppConfig();
        private CorsManagerOptions corsOptions = new CorsManagerOptions();

        public Startup(IHostingEnvironment env)
        {
            var productionConfig = Path.GetFullPath($"../appsettings.{env.EnvironmentName}.json");

            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddJsonFile(productionConfig, optional: !env.IsProduction(), reloadOnChange: true)
                .AddEnvironmentVariables();
            Configuration = builder.Build();

            ConfigurationBinder.Bind(Configuration.GetSection("Cors"), corsOptions);
            ConfigurationBinder.Bind(Configuration.GetSection("AppConfig"), appConfig);
        }

        public IConfigurationRoot Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddHalClientGen(new HalClientGenOptions()
            {
                SourceAssemblies = new Assembly[] { this.GetType().GetTypeInfo().Assembly }
            });

            services.UseAppDatabase(appConfig.ConnectionString);
            services.ConfigureReflectedServices(this.GetType().GetTypeInfo().Assembly);

            var halOptions = new HalcyonConventionOptions()
            {
                BaseUrl = appConfig.BaseUrl,
                HalDocEndpointInfo = new HalDocEndpointInfo(typeof(EndpointDocController))
            };

            services.AddConventionalHalcyon(halOptions);
            services.AddExceptionErrorFilters(new ExceptionFilterOptions()
            {
                DetailedErrors = appConfig.DetailedErrors
            });

            // Add framework services.
            services.AddMvc(o =>
            {
                o.UseExceptionErrorFilters();
                o.UseConventionalHalcyon(halOptions);
            })
            .AddJsonOptions(o =>
            {
                o.SerializerSettings.SetToHalcyonDefault();
                o.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
            });

            services.AddScoped<IToolRunner>(s =>
            {
                return new ToolRunner()
                .AddTool("migrate", new ToolCommand("Migrate database to newest version. Run anytime new migrations have been added.", async a =>
                {
                    await a.Migrate();
                }))
                .AddTool("seed", new ToolCommand("Seed database data. Only needed for an empty database.", async a =>
                {
                    await a.Seed();
                }))
                .AddTool("addadmin", new ToolCommand("Add given guids as a user with permissions to all roles in the database.", async a =>
                {
                    await a.AddAdmin();
                }));
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            app.UseCorsManager(corsOptions, loggerFactory);

            app.UseIdentityServerAuthentication(new IdentityServerAuthenticationOptions
            {
                Authority = "https://localhost:44354/",
                //RequireHttpsMetadata = false,

                ApiName = "api1"
            });

            app.UseMvc();
        }
    }
}

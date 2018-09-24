using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Threax.IdServer.Data;
using Threax.IdServer.Models;
using Threax.IdServer.Services;
using Microsoft.Extensions.DependencyInjection.Extensions;
using IdentityServer4.Services;
using Threax.IdServer.Areas.Api.Controllers;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.CorsManager;
using Newtonsoft.Json;
using Threax.AspNetCore.BuiltInTools;
using Threax.AspNetCore.Halcyon.ClientGen;
using System.Reflection;
using Threax.AspNetCore.UserBuilder;
using Threax.AspNetCore.UserBuilder.Entities.Mvc;
using Threax.AspNetCore.IdServerAuth;
using Microsoft.Extensions.Logging;
using SpcIdentityServer.Services;
using Threax.IdServer.Areas.Api.ValueProviders;
using Microsoft.AspNetCore.HttpOverrides;
using Threax.Extensions.Configuration.SchemaBinder;
using System.IO;

namespace Threax.IdServer
{
    public class Startup
    {
        private IdServerAuthAppOptions authConfig = new IdServerAuthAppOptions()
        {
            Scope = "Threax.IdServer", //The name of the scope for api access
            DisplayName = "Threax.IdServer", //Change this to a pretty name for the client/resource
            ClientId = "Threax.IdServer", //Change this to a unique client id
            AdditionalScopes = new List<String> { /*Additional scopes here "ScopeName", "Scope2Name", "etc"*/ }
        };

        private AppConfig appConfig = new AppConfig();
        private ClientConfig clientConfig = new ClientConfig();
        private CorsManagerOptions corsOptions = new CorsManagerOptions();

        public Startup(IConfiguration configuration)
        {
            Configuration = new SchemaConfigurationBinder(configuration);
            Configuration.Bind("JwtAuth", authConfig);
            Configuration.Bind("AppConfig", appConfig);
            Configuration.Bind("ClientConfig", clientConfig);
            Configuration.Bind("Cors", corsOptions);
        }

        public SchemaConfigurationBinder Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            Threax.AspNetCore.Docker.Certs.CertManager.LoadTrustedRoots(o => Configuration.Bind("CertManager", o));

            services.AddSingleton<GrantTypeValueProvider>();

            services.AddSingleton<IApplicationGuidFactory>(s => new ApplicationGuidFactory(new Guid("65098b58-c5bf-4fc4-ae30-444e274efd7f"))); //This guid can never change, or you will have to fix permissions across all apps
            services.AddSingleton<ApplicationGuidResolver>();

            services.AddConventionalIdServerAuthentication(o =>
            {
                o.ActAsApi = true;
                o.ActAsClient = false;
                o.AppOptions = authConfig;
                o.CookiePath = appConfig.PathBase;
                o.AccessDeniedPath = "/Account/AccessDenied";
            });

            //Add the client side configuration object
            services.AddClientConfig(clientConfig, o =>
            {
                o.RouteArgsToClear = new List<string>() { "inPagePath" };
            });
            
            services.AddAssetBundle(o =>
            {
                o.UseBundles = appConfig.UseAssetBundles;
            });

            services.AddHalClientGen(new HalClientGenOptions()
            {
                SourceAssemblies = new Assembly[] { this.GetType().GetTypeInfo().Assembly }
            });

            services.UseAppDatabase(appConfig.ConnectionString);

            services.AddDbContext<UsersDbContext>(options =>
            {
                options.UseSqlite(appConfig.ConnectionString);
            });
            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<UsersDbContext>()
                .AddDefaultTokenProviders();

            services.TryAddTransient<IClaimsService, ClaimsService>();

            services.AddScoped<IUserClaimsPrincipalFactory<ApplicationUser>, AppUserClaimsPrincipalFactory>();


            // Adds IdentityServer
            services.AddIdentityServer()
                .AddThreaxConfig(appConfig)
                .AddAspNetIdentity<ApplicationUser>();

            // Add application services.
            services.AddTransient<IEmailSender, EmailSender>();

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
            })
            .AddConventionalIdServerMvc();

            services.AddIdServerMetadataClient();

            services.AddUserBuilderForUserWhitelistWithRoles();

            services.AddScoped<IToolRunner>(s =>
            {
                return new ToolRunner()
                .AddTool("migrate", new ToolCommand("Migrate database to newest version. Run anytime new migrations have been added.", async a =>
                {
                    a.Scope.MigrateIdServerDatabase();
                    await a.Migrate();
                    await a.MigrateUserDb();
                }))
                .AddTool("seed", new ToolCommand("Seed database data. Only needed for an empty database.", async a =>
                {
                    a.Scope.SeedIdServerDatabase(appConfig.AppDashboardHost);
                    await a.Seed();
                }))
                .AddTool("addadmin", new ToolCommand("Add given guids as a user with permissions to all roles in the database.", async a =>
                {
                    await a.AddAdmin();
                }))
                .AddTool("updateConfigSchema", new ToolCommand("Update the schema file for this application's configuration.", async a =>
                {
                    var json = await Configuration.CreateSchema();
                    await File.WriteAllTextAsync("appsettings.schema.json", json);
                }))
                .UseClientGenTools();
            });

            services.AddThreaxCSP(o =>
            {
                o.AddDefault().AddNone();
                o.AddImg().AddSelf();
                o.AddConnect().AddSelf();
                o.AddManifest().AddSelf();
                o.AddFont().AddSelf();
                o.AddFrame().AddSelf().AddEntries(new String[] { authConfig.Authority });
                o.AddScript().AddSelf().AddUnsafeInline();
                o.AddStyle().AddSelf().AddUnsafeInline();
                o.AddFrameAncestors().AddSelf().AddEntries(appConfig.FrameAncestors);
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedProto
                //Can add ForwardedHeaders.XForwardedFor later, but tricky with container proxy since we don't know its ip
                //This is enough to get https detection working again, however.
                //https://github.com/aspnet/Docs/issues/2384
            });

            app.UseUrlFix(o =>
            {
                o.CorrectPathBase = appConfig.PathBase;
            });

            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                //app.UseBrowserLink();
                app.UseDatabaseErrorPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseStaticFiles();

            app.UseCorsManager(corsOptions, loggerFactory);

            app.UseAuthentication();

            // Adds IdentityServer
            app.UseIdentityServer();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}

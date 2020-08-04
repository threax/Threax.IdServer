using IdentityServer4.EntityFramework.DbContexts;
using IdentityServer4.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using Threax.AspNetCore.BuiltInTools;
using Threax.AspNetCore.CorsManager;
using Threax.AspNetCore.Halcyon.ClientGen;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.IdServerAuth;
using Threax.AspNetCore.UserBuilder;
using Threax.AspNetCore.UserLookup;
using Threax.AspNetCore.UserLookup.Mvc.Controllers;
using Threax.Extensions.Configuration.SchemaBinder;
using Threax.IdServer.Areas.Api.Controllers;
using Threax.IdServer.Areas.Api.ValueProviders;
using Threax.IdServer.Data;
using Threax.IdServer.Models;
using Threax.IdServer.Repository;
using Threax.IdServer.Services;
using Threax.IdServer.ToolControllers;
using Threax.Sqlite.Ext.EfCore3;

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
        private CorsManagerOptions corsOptions = new CorsManagerOptions();

        public Startup(IConfiguration configuration)
        {
            Configuration = new SchemaConfigurationBinder(configuration);
            Configuration.Bind("JwtAuth", authConfig);
            Configuration.Bind("AppConfig", appConfig);
            Configuration.Bind("Cors", corsOptions);
            Configuration.Define("Deploy", typeof(Threax.DeployConfig.DeploymentConfig));

            if (string.IsNullOrWhiteSpace(appConfig.CacheToken))
            {
                appConfig.CacheToken = this.GetType().Assembly.ComputeMd5ForAllNearby();
            }
        }

        public SchemaConfigurationBinder Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddThreaxProgressiveWebApp(o => Configuration.Bind("DisplayConfig", o));

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
                o.CustomizeCookies = cookOpt =>
                {
                    cookOpt.BearerHttpOnly = false;
                };
            });
            
            services.AddAssetBundle(o =>
            {
                o.UseBundles = appConfig.UseAssetBundles;
            });

            services.AddHalClientGen(new HalClientGenOptions()
            {
                SourceAssemblies = new Assembly[] { this.GetType().GetTypeInfo().Assembly, typeof(UserSearchController).Assembly },
                CSharp = new CSharpOptions()
                {
                    Namespace = "Threax.IdServer.Client"
                }
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
                HalDocEndpointInfo = new HalDocEndpointInfo(typeof(EndpointDocController), appConfig.CacheToken),
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
            .AddNewtonsoftJson(o =>
            {
                o.SerializerSettings.SetToHalcyonDefault();
                o.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
            })
            .AddThreaxUserLookup(o =>
            {
                o.UserSearchServiceType = typeof(UserSearchService);
            })
            .AddRazorRuntimeCompilation()
            .AddConventionalIdServerMvc();

            services.ConfigureHtmlRapierTagHelpers(o =>
            {
                o.FrontEndLibrary = HtmlRapier.TagHelpers.FrontEndLibrary.Bootstrap4;
            });

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
                    a.Scope.SeedIdServerDatabase();
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
                .AddTool("purgeRefreshTokens", new ToolCommand("Remove all the refresh tokens.", async a =>
                {
                    var grantsDb = a.Scope.ServiceProvider.GetRequiredService<PersistedGrantDbContext>();
                    grantsDb.PersistedGrants.RemoveRange(grantsDb.PersistedGrants);
                    await grantsDb.SaveChangesAsync();
                }))
                .AddTool("createCert", new ToolCommand("Create a self signed ssl cert. Also good as an id server signing cert. Include a common name as the 1st argument and the number of years until expiration as the 2nd and a filename as the 3rd.", async a =>
                {
                    var toolController = a.Scope.ServiceProvider.GetRequiredService<CreateCertToolController>();
                    var pass = a.Args.Count > 3 ? a.Args[3] : default(String);
                    await toolController.Run(a.Args[0], int.Parse(a.Args[1]), a.Args[2], pass);
                }))
                .AddTool("setupAppDashboard", new ToolCommand("Setup the app dashboard, include the host as the first argument, do not include the https:// protocol. Optionally include a 2nd argument that is a path to the JwtAuth secret file.", async a =>
                {
                    var toolController = a.Scope.ServiceProvider.GetRequiredService<SetupAppDashboardToolController>();
                    await toolController.Run(a.Args[0], a.Args.Count > 1 ? a.Args[0] : null);
                }))
                .AddTool("changePassword", new ToolCommand("Change the password for the given user guid. This is interactive and will prompt for the password.", async a =>
                {
                    var toolController = a.Scope.ServiceProvider.GetRequiredService<ChangePassword>();
                    await toolController.Run(a.Args[0]);
                }))
                .AddTool("unlockAccount", new ToolCommand("Unlock the account for the given user guid.", async a =>
                {
                    var toolController = a.Scope.ServiceProvider.GetRequiredService<UnlockAccount>();
                    await toolController.Run(a.Args[0]);
                }))
                .AddTool("addfrommetadata", new ToolCommand("Add an app from metadata. Arguments: https://app.domain.com jwtAuthSecret clientCredentialSecret", async a =>
                {
                    var toolController = a.Scope.ServiceProvider.GetRequiredService<AddFromMetadataToolController>();
                    await toolController.Run(a.Args[0], a.Args[1], a.Args[2]);
                }))
                .UseClientGenTools();
            });

            services.AddThreaxCSP(o =>
            {
                o.AddDefault().AddNone();
                o.AddImg().AddSelf().AddData();
                o.AddConnect().AddSelf();
                o.AddManifest().AddSelf();
                o.AddFont().AddSelf();
                o.AddFrame().AddSelf().AddEntries(new String[] { authConfig.Authority });
                o.AddScript().AddSelf().AddNonce();
                o.AddStyle().AddSelf().AddNonce();
                o.AddFrameAncestors().AddSelf().AddEntries(appConfig.FrameAncestors);
            });

            services.AddScoped<IIdServerUserRepository, IdServerUserRepository>();
            services.AddScoped<IUserSearchService, UserSearchService>();
            services.AddScoped<SetupAppDashboardToolController>();
            services.AddScoped<CreateCertToolController>();
            services.AddScoped<ChangePassword>();
            services.AddScoped<UnlockAccount>();
            services.AddScoped<AddFromMetadataToolController>();
            services.AddScoped<IClientRepository, ClientRepository>();
            services.AddScoped<IApiResourceRepository, ApiResourceRepository>();

            services.AddLogging(o =>
            {
                o.AddConfiguration(Configuration.GetSection("Logging"))
                    .AddConsole()
                    .AddDebug();
            });

            services.AddSingleton<AppConfig>(appConfig);

            if (appConfig.EnableResponseCompression)
            {
                services.AddResponseCompression();
            }
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory)
        {
            app.Use(async (c, n) =>
            {
                var request = c.Request;
                var response = c.Response;
                response.OnStarting(() =>
                {
                    //For some reason when the antiforgery token header is set x-frame-options is also set to sameorigin.
                    //This will set the cookie, but it won't display the website. This prevents the login screen from appearing,
                    //but it works on refresh. When this happens return a redirect, which will set the cookie but then get the
                    //browser to display the login screen correctly.

                    if (response.Headers.ContainsKey("x-frame-options") && request.Method == "GET")
                    {
                        response.Headers.Add("Location", Microsoft.AspNetCore.Http.Extensions.UriHelper.GetEncodedUrl(request));
                        response.StatusCode = 302;
                    }

                    return Task.CompletedTask;
                });

                await n.Invoke();
            });
            
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

            if (appConfig.ErrorPages)
            {
                app.UseDeveloperExceptionPage();
                app.UseDatabaseErrorPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            if (appConfig.EnableResponseCompression)
            {
                app.UseResponseCompression();
            }

            //Setup static files
            var staticFileOptions = new StaticFileOptions();
            if (appConfig.CacheStaticAssets)
            {
                staticFileOptions.OnPrepareResponse = ctx =>
                {
                    //If the request is coming in with a v query it can be cached
                    if (!String.IsNullOrWhiteSpace(ctx.Context.Request.Query["v"]))
                    {
                        ctx.Context.Response.Headers["Cache-Control"] = appConfig.CacheControlHeaderString;
                    }
                };
            }
            app.UseStaticFiles(staticFileOptions);

            app.UseCorsManager(corsOptions, loggerFactory);

            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseIdentityServer();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.IO;
using Threax.AspNetCore.BuiltInTools;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.IdServerAuth;
using Threax.AspNetCore.UserBuilder;
using Threax.Extensions.Configuration.SchemaBinder;
using Threax.IdServer;

namespace AppDashboard
{
    public class Startup
    {
        private IdServerAuthAppOptions authConfig = new IdServerAuthAppOptions()
        {
            ClientId = "AppDashboard",
            DisplayName = "App Dashboard",
            Scope = "Threax.IdServer",
            AdditionalScopes = new List<string>(){}
        };
        private ClientConfig clientConfig = new ClientConfig();
        private AppConfig appConfig = new AppConfig();

        public Startup(IConfiguration configuration)
        {
            Configuration = new SchemaConfigurationBinder(configuration);
            Configuration.Bind("JwtAuth", authConfig);
            Configuration.Bind("ClientConfig", clientConfig);
            Configuration.Bind("AppConfig", appConfig);
            Configuration.Define("Deploy", typeof(Threax.DeployConfig.DeploymentConfig));
            Configuration.Define("Build", typeof(Threax.DockerBuildConfig.BuildConfig));
            Configuration.Define("Deploy", typeof(Threax.DeployConfig.DeploymentConfig));

            clientConfig.BearerCookieName = $"{authConfig.ClientId}.BearerToken";

            if (string.IsNullOrWhiteSpace(appConfig.CacheToken))
            {
                appConfig.CacheToken = this.GetType().Assembly.ComputeMd5ForAllNearby();
            }
        }

        public SchemaConfigurationBinder Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.TryAddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddThreaxProgressiveWebApp(o => Configuration.Bind("DisplayConfig", o));

            services.AddClientConfig(clientConfig, o =>
            {
                o.RouteArgsToClear = new List<string>() { "inPagePath" };
            });

            services.AddAssetBundle(o =>
            {
                o.UseBundles = appConfig.UseAssetBundles;
            });

            services.ConfigureHtmlRapierTagHelpers(o =>
            {
                o.FrontEndLibrary = HtmlRapier.TagHelpers.FrontEndLibrary.Bootstrap5;
            });

            services.AddConventionalIdServerAuthentication(o =>
            {
                o.AppOptions = authConfig;
                o.CookiePath = appConfig.PathBase;
                o.ActAsApi = false;
                o.AccessDeniedPath = "/Account/AccessDenied";
            });

            services.AddMvc()
            .AddNewtonsoftJson(o =>
            {
                o.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                o.SerializerSettings.Converters.Add(new StringEnumConverter());
            })
            .AddRazorRuntimeCompilation()
            .AddConventionalIdServerMvc()
            .AddThreaxCacheUi(appConfig.CacheToken, o =>
            {
                o.CacheControlHeader = appConfig.CacheControlHeaderString;
            });

            services.AddUserBuilderForAnybody(opt => //This is anybody, but it is further restricted below
            {
                opt.ConfigureAddititionalPolicies = arg => new HypermediaUserBuilder(clientConfig.ServiceUrl, arg.Services.GetRequiredService<ILoggerFactory>());
                opt.UseClaimsCache = false; //Disable claims cache for app dashboard
            });

            services.AddScoped<IToolRunner>(s =>
            {
                return new ToolRunner()
                .AddTool("updateConfigSchema", new ToolCommand("Update the schema file for this application's configuration.", async a =>
                {
                    var json = await Configuration.CreateSchema();
                    await File.WriteAllTextAsync("appsettings.schema.json", json);
                }));
            });

            services.AddThreaxCSP(o =>
            {
                o.AddDefault().AddNone();
                o.AddImg().AddSelf().AddData();
                o.AddConnect().AddSelf().AddEntries(new String[] { $"https://{new Uri(clientConfig.ServiceUrl).Authority}" });
                o.AddManifest().AddSelf();
                o.AddFont().AddSelf();
                o.AddFrame().AddSelf().AddEntries(new String[] { authConfig.Authority });
                o.AddScript().AddSelf().AddNonce();
                o.AddStyle().AddSelf().AddNonce();
                o.AddFrameAncestors().AddSelf();
            });

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

            services.AddConnectedServices(Configuration);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app)
        {
            Microsoft.IdentityModel.Logging.IdentityModelEventSource.ShowPII = true;

            var forwardOptions = new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedProto
            };
            //Allow proto header from any network
            forwardOptions.KnownIPNetworks.Clear();
            forwardOptions.KnownProxies.Clear();
            app.UseForwardedHeaders(forwardOptions);

            app.UseUrlFix(o =>
            {
                o.CorrectPathBase = appConfig.PathBase;
            });

            app.UseExceptionHandler("/Home/Error");

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

            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "cacheUi",
                    pattern: "{controller=Home}/{cacheToken}/{action=Index}/{*inPagePath}");

                endpoints.MapControllerRoute(
                    name: "root",
                    pattern: "{action=Index}/{*inPagePath}",
                    defaults: new { controller = "Home" });

                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{*inPagePath}");
            });
        }
    }
}

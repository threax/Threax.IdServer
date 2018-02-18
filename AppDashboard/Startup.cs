using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using System.Collections.Generic;
using System.IO;
using Threax.AspNetCore.IdServerAuth;
using Threax.AspNetCore.UserBuilder;

namespace OlsAppDashboard
{
    public class Startup
    {
        private IdServerAuthAppOptions authConfig = new IdServerAuthAppOptions()
        {
            ClientId = "AppDashboard",
            DisplayName = "App Dashboard",
            Scope = "Threax.IdServer",
            AdditionalScopes = new List<string>(){ "userdirectory" }
        };
        private ClientConfig clientConfig = new ClientConfig();
        private AppConfig appConfig = new AppConfig();

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
            ConfigurationBinder.Bind(Configuration.GetSection("JwtAuth"), authConfig);
            ConfigurationBinder.Bind(Configuration.GetSection("ClientConfig"), clientConfig);
            ConfigurationBinder.Bind(Configuration.GetSection("AppConfig"), appConfig);
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.TryAddSingleton<IHttpContextAccessor, HttpContextAccessor>();

            services.AddClientConfig(clientConfig, o =>
            {
                o.RouteArgsToClear = new List<string>() { "inPagePath" };
            });

            services.AddAssetBundle(o =>
            {
                o.UseBundles = appConfig.UseAssetBundles;
            });

            services.AddConventionalIdServerAuthentication(o =>
            {
                o.AppOptions = authConfig;
                o.CookiePath = appConfig.PathBase;
                o.ActAsApi = false;
                o.AccessDeniedPath = "/Account/AccessDenied";
            });

            services.AddMvc()
            .AddJsonOptions(o =>
            {
                o.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                o.SerializerSettings.Converters.Add(new StringEnumConverter());
            })
            .AddConventionalIdServerMvc();

            services.AddUserBuilderForAnybody(opt => //This is anybody, but it is further restricted below
            {
                opt.ConfigureAddititionalPolicies = arg => new HypermediaUserBuilder(clientConfig.IdentityServerHost + "/entrypoint", arg.Services.GetRequiredService<ILoggerFactory>());
                opt.UseClaimsCache = false; //Disable claims cache for app dashboard
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            app.UseUrlFix(o =>
            {
                o.CorrectPathBase = appConfig.PathBase;
            });

            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            if (appConfig.EnableDebugLogging)
            {
                loggerFactory.AddDebug();
            }

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseStaticFiles();

            app.UseAuthentication();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "root",
                    template: "{action=Index}/{*inPagePath}",
                    defaults: new { controller = "Home" });

                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{*inPagePath}");
            });
        }
    }
}

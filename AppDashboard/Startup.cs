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
using Threax.AspNetCore.IdServerAuth;
using Threax.AspNetCore.UserBuilder;
using Threax.Extensions.Configuration.SchemaBinder;

namespace AppDashboard
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
            Configuration = new SchemaConfigurationBinder(configuration);
            Configuration.Bind("JwtAuth", authConfig);
            Configuration.Bind("ClientConfig", clientConfig);
            Configuration.Bind("AppConfig", appConfig);
        }

        public SchemaConfigurationBinder Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            Threax.AspNetCore.Docker.Certs.CertManager.LoadTrustedRoots(o => Configuration.Bind("CertManager", o));

            services.TryAddSingleton<IHttpContextAccessor, HttpContextAccessor>();

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
                o.FrontEndLibrary = HtmlRapier.TagHelpers.FrontEndLibrary.Bootstrap3;
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
                o.AddImg().AddSelf();
                o.AddConnect().AddSelf().AddEntries(new String[] { $"https://{new Uri(clientConfig.IdentityServerHost).Authority}" });
                o.AddManifest().AddSelf();
                o.AddFont().AddSelf();
                o.AddFrame().AddSelf().AddEntries(new String[] { authConfig.Authority });
                o.AddScript().AddSelf().AddUnsafeInline();
                o.AddStyle().AddSelf().AddUnsafeInline();
                o.AddFrameAncestors().AddSelf();
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

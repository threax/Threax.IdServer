using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Threax.AspNetCore.CorsManager;
using Microsoft.Extensions.Logging;
using System.Text;

namespace Microsoft.AspNetCore.Builder
{
    /// <summary>
    /// Provides an easy way to configure cors through appsettings.json
    /// </summary>
    public static class CorsManagerExtensions
    {
        /// <summary>
        /// Activate the Cors Manager Middleware.
        /// </summary>
        /// <param name="app">The app builder.</param>
        /// <param name="options">The options.</param>
        /// <returns>The app builder passed in.</returns>
        public static IApplicationBuilder UseCorsManager(this IApplicationBuilder app, CorsManagerOptions options, ILoggerFactory loggerFactory)
        {
            var logger = loggerFactory.CreateLogger("Threax.CorsManager");

            if (options.UnlimitedAccess)
            {
                logger.LogInformation("Activating unlimited cors access. This should not be enabled in production.");

                app.UseCors(builder =>
                {
                    builder
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowAnyOrigin()
                    .AllowCredentials();
                });
            }
            else
            {
                if (options.AllowedOrigins != null && options.AllowedOrigins.Count > 0)
                {
                    var sb = new StringBuilder();
                    foreach(var host in options.AllowedOrigins)
                    {
                        sb.AppendFormat("{0} ", host);
                    }

                    logger.LogInformation($"Activating cors access to the following origins: {sb.ToString()}");

                    app.UseCors(builder =>
                    {
                        builder
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .WithOrigins(options.AllowedOrigins.ToArray())
                        .AllowCredentials();
                    });
                }
            }

            return app;
        }
    }
}

﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Threax.AspNetCore.BuiltInTools;

namespace Threax.IdServer
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var tools = new ToolManager(args);
            var host = BuildWebHostWithConfig(tools.GetCleanArgs(), tools.GetEnvironment());

            if (tools.ProcessTools(host))
            {
                host.Run();
            }
        }

        /// <summary>
        /// This version of BuildWebHost allows entity framework commands to work correctly.
        /// </summary>
        /// <param name="args">The args to use for the builder.</param>
        /// <returns>The constructed IWebHost.</returns>
        public static IWebHost BuildWebHost(string[] args)
        {
            return BuildWebHostWithConfig(args);
        }

        /// <summary>
        /// The is the real build web host function, you can specify a config name to force load or leave it null to use the current environment.
        /// </summary>
        /// <param name="args">The args to use for the builder.</param>
        /// <param name="toolsConfigName">The name of the tools config to load, or null to not load these configs.</param>
        /// <returns>The constructed IWebHost.</returns>
        public static IWebHost BuildWebHostWithConfig(string[] args, String toolsConfigName = null)
        {
            var webHostBuilder = WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>()
                .ConfigureAppConfiguration((hostContext, config) =>
                {
                    var env = hostContext.HostingEnvironment;
                    config.Sources.Clear();

                    //./appsettings.json - Main settings file, shared between all instances
                    config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);

                    //./appsettings.{environment}.json - Local development settings files, loaded per environment, no need to deploy to server
                    config.AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

                    //./appsettings.tools.json - Local development tools settings files, loaded in tools mode, no need to deploy to server
                    if (toolsConfigName != null)
                    {
                        config.AddJsonFile($"appsettings.{toolsConfigName}.json", optional: true);
                    }

                    //Secrets
                    if (File.Exists("appsettings.secrets.json"))
                    {
                        config.AddJsonFileWithInclude(Path.GetFullPath("appsettings.secrets.json"), optional: false);
                    }
                    else
                    {
                        config.AddUserSecrets<Program>();
                    }

                    //Environment variables
                    config.AddEnvironmentVariables();

                    //Command line config args need to go before any tool commands
                    config.AddCommandLine(args);

                    config.UseConnectedConfig();
                });

            return webHostBuilder.Build();
        }
    }
}

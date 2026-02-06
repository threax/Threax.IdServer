using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore;
using Microsoft.Extensions.Configuration;
using Threax.AspNetCore.BuiltInTools;
using Threax.IdServer;
using Microsoft.Extensions.Hosting;

namespace AppDashboard
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var tools = new ToolManager(args);
            var toolsEnv = tools.GetEnvironment();
            var toolsConfigName = default(String);
            if (toolsEnv != null)
            {
                //If we are running tools, clear the arguments (this causes an error if the tool args are passed) and set the tools config to the environment name
                args = new String[0];
                toolsConfigName = toolsEnv;
            }

            var host = BuildWebHostWithConfig(args, toolsConfigName);

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
        public static IHost BuildWebHost(string[] args)
        {
            return BuildWebHostWithConfig(args);
        }

        /// <summary>
        /// The is the real build web host function, you can specify a config name to force load or leave it null to use the current environment.
        /// </summary>
        /// <param name="args">The args to use for the builder.</param>
        /// <param name="toolsConfigName">The name of the tools config to load, or null to not load these configs.</param>
        /// <returns>The constructed IWebHost.</returns>
        public static IHost BuildWebHostWithConfig(string[] args, String toolsConfigName = null)
        {
            var webHostBuilder = new HostBuilder()
                .ConfigureWebHostDefaults(webHostBuilder =>
                {
                    webHostBuilder.UseStartup<Startup>();
                })
                .ConfigureAppConfiguration((hostContext, config) =>
                {
                    var env = hostContext.HostingEnvironment;
                    config.Sources.Clear();

                    //./appsettings.json - Main settings file, shared between all instances
                    config.AddJsonFileWithInclude("appsettings.json", optional: true, reloadOnChange: true);

                    //./appsettings.{environment}.json - Local development settings files, loaded per environment, no need to deploy to server
                    config.AddJsonFileWithInclude($"appsettings.{env.EnvironmentName}.json", optional: true);

                    //./appsettings.tools.json - Local development tools settings files, loaded in tools mode, no need to deploy to server
                    if (toolsConfigName != null)
                    {
                        config.AddJsonFileWithInclude($"appsettings.{toolsConfigName}.json", optional: true);
                    }

                    //Legacy to load local secrets file. Not reccomended, needs to be removed.
                    if (File.Exists("appsettings.secrets.json"))
                    {
                        config.AddJsonFileWithInclude(Path.GetFullPath("appsettings.secrets.json"), optional: false);
                    }

                    //Build the config so far and load the KeyPerFilePath.
                    var built = config.Build();
                    var keyPerFilePath = built.GetSection("AppConfig")?.GetValue<String>("KeyPerFilePath");
                    if (!String.IsNullOrEmpty(keyPerFilePath))
                    {
                        keyPerFilePath = Path.GetFullPath(keyPerFilePath);
                        config.AddKeyPerFile(keyPerFilePath, false);
                    }

                    if (built.GetSection("AppConfig")?.GetValue<bool>("AddUserSecrets") == true)
                    {
                        config.AddUserSecrets<Program>();
                    }

                    //Environment variables
                    config.AddEnvironmentVariables();
                    config.AddCommandLine(args);

                    config.UseConnectedConfig();
                });

            return webHostBuilder.Build();
        }
    }
}

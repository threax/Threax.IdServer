using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Threax.AspNetCore.BuiltInTools;

namespace TestApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var tools = new ToolManager(args);
            var env = tools.GetEnvironment();

            var hostBuilder = new WebHostBuilder()
                .UseKestrel()
                .UseContentRoot(Directory.GetCurrentDirectory())
                .UseIISIntegration()
                .UseStartup<Startup>();

            if (env != null)
            {
                hostBuilder.UseEnvironment(env);
            }

            var host = hostBuilder.Build();

            if (tools.ProcessTools(host))
            {
                host.Run();
            }
        }
    }
}

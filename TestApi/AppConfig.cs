using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TestApi
{
    public class AppConfig
    {
        public string BaseUrl { get; set; } = HalcyonConventionOptions.HostVariable;

        public string ConnectionString { get; set; }

        public bool DetailedErrors { get; set; }
    }
}

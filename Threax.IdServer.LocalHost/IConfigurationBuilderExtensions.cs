using Microsoft.Extensions.Configuration;
using System;

namespace Threax.IdServer
{
    public static class IConfigurationBuilderExtensions
    {
        public static IConfigurationBuilder UseConnectedConfig(this IConfigurationBuilder config)
        {
            return config;
        }
    }
}

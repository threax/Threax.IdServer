using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Threax.Extensions.Configuration.SchemaBinder;

namespace Threax.IdServer
{
    public static class IConfigurationBuilderExtensions
    {
        public static IConfigurationBuilder UseConnectedConfig(this IConfigurationBuilder config)
        {
            config.AddThreaxKeyVaultConfig();

            return config;
        }

        public static IServiceCollection AddConnectedServices(this IServiceCollection services, SchemaConfigurationBinder configuration)
        {
            services.AddThreaxAzureStorageDataProtection(o => configuration.Bind("Storage", o), o => configuration.Bind("AzureDataProtection", o));

            return services;
        }
    }
}

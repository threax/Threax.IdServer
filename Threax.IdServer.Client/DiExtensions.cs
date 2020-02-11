using Microsoft.Extensions.DependencyInjection.Extensions;
using System;
using Threax.AspNetCore.Halcyon.Client;
using Threax.IdServer.Client;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class DiExtensions
    {
        /// <summary>
        /// Add the Threax.IdServer.Client EntryPointsInjector to the services.
        /// </summary>
        /// <param name="services">The service collection.</param>
        /// <param name="configure">The configure callback.</param>
        /// <returns></returns>
        public static IHalcyonClientSetup<EntryPointsInjector> AddThreaxIdServerClient(this IServiceCollection services, Action<ClientOptions> configure)
        {
            var options = new ClientOptions();
            configure?.Invoke(options);

            services.TryAddScoped<EntryPointsInjector>(s => new EntryPointsInjector(options.ServiceUrl, s.GetRequiredService<IHttpClientFactory<EntryPointsInjector>>()));

            return new HalcyonClientSetup<EntryPointsInjector>(services);
        }
    }
}

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
        public static IServiceCollection AddThreaxIdServerClient(this IServiceCollection services, Action<ClientOptions> configure)
        {
            var options = new ClientOptions();
            configure?.Invoke(options);

            var sharedCredentials = new SharedClientCredentials();
            options.GetSharedClientCredentials?.Invoke(sharedCredentials);
            sharedCredentials.MergeWith(options.ClientCredentials);

            services.TryAddSingleton<ClientCredentials<IHttpClientFactory>>(s => new ClientCredentials<IHttpClientFactory>(new DefaultHttpClientFactory()));
            services.TryAddSingleton<ClientCredentials<IHttpClientFactory<EntryPointsInjector>>>(s =>
            {
                return new ClientCredentials<IHttpClientFactory<EntryPointsInjector>>(
                    new ClientCredentialsAccessTokenFactory<EntryPointsInjector>(options.ClientCredentials,
                    new BearerHttpClientFactory<EntryPointsInjector>(s.GetRequiredService<ClientCredentials<IHttpClientFactory>>().Wrapped)));
            });
            services.TryAddScoped<ClientCredentials<EntryPointsInjector>>(s =>
            {
                return new ClientCredentials<EntryPointsInjector>(
                    new EntryPointsInjector(options.ServiceUrl, s.GetRequiredService<ClientCredentials<IHttpClientFactory<EntryPointsInjector>>>().Wrapped));
            });
            services.TryAddScoped<EntryPointsInjector>(s =>
            {
                return s.GetRequiredService<ClientCredentials<EntryPointsInjector>>().Wrapped;
            });

            return services;
        }
    }
}

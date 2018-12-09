using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Threax.IdServer.Client;
using System;
using Threax.AspNetCore.AuthCore;
using Threax.AspNetCore.Halcyon.Client;
using ServiceClient;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class DiExtensions
    {
        /// <summary>
        /// Add the SpcIdentityServer setup to use client credentials to connect to the service.
        /// </summary>
        /// <param name="services">The service collection.</param>
        /// <param name="configure">The configure callback.</param>
        /// <returns></returns>
        public static IServiceCollection AddSpcIdentityServerWithClientCredentials(this IServiceCollection services, Action<SpcIdentityServerOptions> configure)
        {
            var options = new SpcIdentityServerOptions();
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

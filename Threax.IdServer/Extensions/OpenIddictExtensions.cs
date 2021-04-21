using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Abstractions;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using static OpenIddict.Abstractions.OpenIddictConstants;
using static OpenIddict.Server.OpenIddictServerEvents;
using static OpenIddict.Server.OpenIddictServerHandlerFilters;
using static OpenIddict.Server.OpenIddictServerHandlers;

namespace Threax.IdServer.Extensions
{
    public static class OpenIddictExtensions
    {
        public static OpenIddictServerBuilder AddCertificate(this OpenIddictServerBuilder options, String thumbprint)
        {
            var cert = Load(thumbprint);
            options.AddEncryptionCertificate(cert);
            options.AddSigningCertificate(cert);
            return options;
        }

        private static X509Certificate2 Load(string thumbprint)
        {
            if (File.Exists(thumbprint))
            {
                return new X509Certificate2(thumbprint);
            }
            else
            {
                var store = new X509Store(StoreName.My, StoreLocation.LocalMachine);
                store.Open(OpenFlags.ReadOnly);
                var cert = store.Certificates.OfType<X509Certificate2>().FirstOrDefault(i => thumbprint.Equals(i.Thumbprint, System.StringComparison.OrdinalIgnoreCase));
                if (cert == null)
                {
                    throw new InvalidOperationException($"Cannot find token certificate with thumbprint {thumbprint} in the Local Computer's Personal Certificate Store.");
                }

                return cert;
            }
        }

        public static OpenIddictServerBuilder AddCustomClaims(this OpenIddictServerBuilder options)
        {
            options.RegisterClaims(Claims.NotBefore);

            options.AddEventHandler<ProcessSignInContext>(builder =>
            {
                // Make this event handler run just before GenerateIdentityModelAccessToken
                builder.SetOrder(GenerateIdentityModelAccessToken.Descriptor.Order - 1)
                    // Only run the event handler if an access token was generated
                    .AddFilter<RequireAccessTokenGenerated>()
                    .SetType(OpenIddict.Server.OpenIddictServerHandlerType.Custom)
                    .UseInlineHandler(context =>
                    {
                        ClaimsIdentity ci = context.AccessTokenPrincipal.Identity as ClaimsIdentity;
                        ci.AddClaim(Claims.NotBefore, EpochTime.GetIntDate(DateTime.UtcNow).ToString());
                        return default;
                    });
            });

            return options;
        }
    }
}

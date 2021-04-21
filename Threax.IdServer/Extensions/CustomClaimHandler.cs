using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Abstractions;
using System;
using System.Security.Claims;
using static OpenIddict.Abstractions.OpenIddictConstants;
using static OpenIddict.Server.OpenIddictServerEvents;
using static OpenIddict.Server.OpenIddictServerHandlerFilters;
using static OpenIddict.Server.OpenIddictServerHandlers;

namespace Threax.IdServer.Extensions
{
    public static class CustomClaimHandler
    {
        public static OpenIddictServerBuilder AddCustomClaims(this OpenIddictServerBuilder options)
        {
            options.RegisterClaims(Claims.NotBefore, Threax.AspNetCore.AuthCore.ClaimTypes.ObjectGuid);

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
                        var objectGuidClaim = ci.FindFirst(Threax.AspNetCore.AuthCore.ClaimTypes.ObjectGuid);
                        if(objectGuidClaim == null)
                        {
                            var sub = ci.FindFirst(Claims.Subject);
                            ci.AddClaim(Threax.AspNetCore.AuthCore.ClaimTypes.ObjectGuid, sub.Value);
                        }
                        return default;
                    });
            });

            return options;
        }
    }
}

using Microsoft.Extensions.Logging;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Threax.AspNetCore.AuthCore;
using Threax.AspNetCore.Halcyon.Client;
using Threax.AspNetCore.UserBuilder;
using Threax.AspNetCore.UserBuilder.Entities;

namespace AppDashboard
{
    public class HypermediaUserBuilder : UserAuthorizerBuilderLink
    {
        private String entryPoint;
        private ILoggerFactory loggerFactory;

        public HypermediaUserBuilder(String entryPoint, ILoggerFactory loggerFactory, IUserBuilder next = null)
            : base(next)
        {
            this.entryPoint = entryPoint;
            this.loggerFactory = loggerFactory;
        }

        public override async Task<bool> ValidateAndBuildUser(ClaimsPrincipal principal)
        {
            var httpClientFactory = new AddHeaderHttpClientFactory<HalEndpointClient>("bearer", () =>
            {
                return principal.GetAccessToken();
            }, new DefaultHttpClientFactory());

            var claimsId = principal.Identity as ClaimsIdentity;
            bool valid = false;

            try
            {
                var entryPoints = await HalEndpointClient.Load(new HalLink(entryPoint), httpClientFactory);
                if (entryPoints.HasLink("listClients"))
                {
                    valid = true;
                    claimsId.AddClaim(new Claim(claimsId.RoleClaimType, Roles.EditClients));
                }
                if (entryPoints.HasLink("listApiResource"))
                {
                    valid = true;
                    claimsId.AddClaim(new Claim(claimsId.RoleClaimType, Roles.EditApiResources));
                }
                if (entryPoints.HasLink("SetUser"))
                {
                    valid = true;
                    claimsId.AddClaim(new Claim(claimsId.RoleClaimType, AuthorizationAdminRoles.EditRoles));
                }

                if (!valid)
                {
                    var cookieAuthLog = loggerFactory.CreateLogger("CookieAuthentication");
                    cookieAuthLog.LogError($"Cannot login user {principal.GetUserLogString()}, they do not have a listClients or listApiResources claim");
                }
            }
            catch (Exception ex)
            {
                var cookieAuthLog = loggerFactory.CreateLogger("CookieAuthentication");
                cookieAuthLog.LogError($"Cannot login user {principal.GetUserLogString()}, a {ex.GetType()} with message {ex.Message} was thrown while contacting {entryPoint}.");
                valid = false;
            }

            return await this.ChainNext(valid, principal);
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IdentityServer4.Services;
using Microsoft.Extensions.Logging;
using IdentityServer4.Models;
using IdentityServer4.Validation;
using System.Security.Claims;

namespace Threax.IdServer.Services
{
    public class ClaimsService : DefaultClaimsService
    {
        public ClaimsService(IProfileService profile, ILogger<DefaultClaimsService> logger)
            : base(profile, logger)
        {

        }

        public override async Task<IEnumerable<Claim>> GetAccessTokenClaimsAsync(ClaimsPrincipal subject, Client client, Resources resources, ValidatedRequest request)
        {
            var claims = await base.GetAccessTokenClaimsAsync(subject, client, resources, request);
            claims = claims.Concat(GetUserInfoClaims(subject));
            return claims;
        }

        public override async Task<IEnumerable<Claim>> GetIdentityTokenClaimsAsync(ClaimsPrincipal subject, Client client, Resources resources, bool includeAllIdentityClaims, ValidatedRequest request)
        {
            var baseClaims = await base.GetIdentityTokenClaimsAsync(subject, client, resources, includeAllIdentityClaims, request);
            IEnumerable<Claim> claims = GetUserInfoClaims(subject);
            return baseClaims.Concat(claims);
        }

        private static IEnumerable<Claim> GetUserInfoClaims(ClaimsPrincipal subject)
        {
            foreach (var claim in subject.Claims)
            {
                switch (claim.Type)
                {
                    case AppUserClaimsPrincipalFactory.ObjectGuid:
                        yield return new Claim(claim.Type, claim.Value);
                        break;
                }
            }
        }
    }
}

﻿//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Threading.Tasks;
//using Microsoft.Extensions.Logging;
//using IdentityServer4.Models;
//using System.Security.Claims;
//using Threax.IdServer.Services;

//namespace Threax.IdServer.Services
//{
//    public class ClaimsService : DefaultClaimsService
//    {
//        private IApplicationGuidFactory appGuidFactory;

//        public ClaimsService(IProfileService profile, ILogger<DefaultClaimsService> logger, IApplicationGuidFactory appGuidFactory)
//            : base(profile, logger)
//        {
//            this.appGuidFactory = appGuidFactory;
//        }

//        public override async Task<IEnumerable<Claim>> GetAccessTokenClaimsAsync(ClaimsPrincipal subject, ResourceValidationResult resources, ValidatedRequest request)
//        {
//            var claims = await base.GetAccessTokenClaimsAsync(subject, resources, request);
//            if (request.Client.AllowedGrantTypes.Contains(GrantType.ClientCredentials) && subject == null)
//            {
//                claims = claims.Concat(GetApplicationClaims(request.Client));
//            }
//            else
//            {
//                claims = claims.Concat(GetUserInfoClaims(subject));
//            }
//            return claims;
//        }

//        public override async Task<IEnumerable<Claim>> GetIdentityTokenClaimsAsync(ClaimsPrincipal subject, ResourceValidationResult resources, bool includeAllIdentityClaims, ValidatedRequest request)
//        {
//            var baseClaims = await base.GetIdentityTokenClaimsAsync(subject, resources, includeAllIdentityClaims, request);
//            IEnumerable<Claim> claims = GetUserInfoClaims(subject);
//            return baseClaims.Concat(claims);
//        }

//        private static IEnumerable<Claim> GetUserInfoClaims(ClaimsPrincipal subject)
//        {
//            foreach (var claim in subject.Claims)
//            {
//                switch (claim.Type)
//                {
//                    case AppUserClaimsPrincipalFactory.ObjectGuid:
//                        yield return new Claim(claim.Type, claim.Value);
//                        break;
//                    case AppUserClaimsPrincipalFactory.UserName:
//                        yield return new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name", claim.Value);
//                        break;
//                }
//            }
//        }

//        private IEnumerable<Claim> GetApplicationClaims(IdentityServer4.Models.Client client)
//        {
//            //Create a deterministic guid based on the ApplicationGuid namespace and the name of the client.
//            yield return new Claim(AppUserClaimsPrincipalFactory.ObjectGuid, appGuidFactory.CreateGuid(client).ToString());
//        }
//    }
//}

using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Builder;
using Threax.IdServer.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace Threax.IdServer.Services
{
    /// <summary>
    /// This class transforms our user claims for external to spc users.
    /// </summary>
    public class AppUserClaimsPrincipalFactory : UserClaimsPrincipalFactory<ApplicationUser, IdentityRole>
    {
        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="userManager"></param>
        /// <param name="roleManager"></param>
        /// <param name="optionsAccessor"></param>
        public AppUserClaimsPrincipalFactory(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IOptions<IdentityOptions> optionsAccessor)
            : base(userManager, roleManager, optionsAccessor)
        {
        }

        public const String ObjectGuid = "objectGUID";

        /// <summary>
        /// Create the user.
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        public async override Task<ClaimsPrincipal> CreateAsync(ApplicationUser user)
        {
            var principal = await base.CreateAsync(user);

            var claimsId = principal.Identity as ClaimsIdentity;
            if (claimsId != null)
            {
                claimsId.AddClaims(new[] {
                    new Claim(ObjectGuid, user.Id.ToString())
                });
            }

            return principal;
        }
    }
}

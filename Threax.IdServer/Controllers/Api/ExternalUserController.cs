using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Threax.AspNetCore.ExceptionFilter;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.IdServer.Models;

namespace Threax.IdServer.Areas.Api.Controllers
{
    [Authorize(Roles = Roles.ViewExternalUsers, AuthenticationSchemes = AuthCoreSchemes.Bearer)]
    [Route("api/[controller]")]
    [ResponseCache(NoStore = true)]
    public class ExternalUsersController : Controller
    {
        private readonly UserManager<ApplicationUser> userManager;
        private readonly SignInManager<ApplicationUser> signInManager;
        private readonly ILogger logger;

        public ExternalUsersController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ILoggerFactory loggerFactory)
        {
            this.userManager = userManager;
            this.signInManager = signInManager;
            this.logger = loggerFactory.CreateLogger<ExternalUsersController>();
        }

        /// <summary>
        /// Get a list of all clients.
        /// </summary>
        /// <returns></returns>
        [HttpPost("[action]")]
        [HalRel(CrudRels.List)]
        public async Task<ExternalUserCollection> List([FromBody] ExternalUserQuery query, [FromServices] Data.UsersDbContext userDb)
        {
            var dbQuery = await query.Create(userDb.Users);
            var total = await dbQuery.CountAsync();
            dbQuery = dbQuery.Skip(query.SkipTo(total)).Take(query.Limit);
            var resultQuery = dbQuery.Select(i => new ExternalUserView()
            {
                DisplayName = $"{i.FirstName} {i.LastName}",
                Email = i.Email,
                GivenName = i.FirstName,
                Surname = i.LastName,
                UserId = i.Id,
                UserName = i.UserName
            });
            var results = await resultQuery.ToListAsync();
            return new ExternalUserCollection(query, total, results);
        }

        /// <summary>
        /// Get a list of all clients.
        /// </summary>
        /// <returns></returns>
        [HttpGet("[action]/{UserId}")]
        [HalRel(CrudRels.Get)]
        public async Task<ExternalUserView> Get(Guid userId, [FromServices] Data.UsersDbContext userDb)
        {
            var user = await userDb.Users.Where(i => i.Id == userId).FirstAsync();
            return new ExternalUserView()
            {
                DisplayName = $"{user.FirstName} {user.LastName}",
                Email = user.Email,
                GivenName = user.FirstName,
                Surname = user.LastName,
                UserId = user.Id,
                UserName = user.UserName
            };
        }
    }
}

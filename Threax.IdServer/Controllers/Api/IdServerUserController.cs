using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.IdServer.InputModels;
using Threax.IdServer.Models.Api;
using Threax.IdServer.Repository;

namespace Threax.IdServer.Areas.Api.Controllers
{
    [Authorize(Roles = Roles.ViewIdServerUsers, AuthenticationSchemes = AuthCoreSchemes.Bearer)]
    [Route("api/[controller]")]
    [ResponseCache(NoStore = true)]
    public class IdServerUsersController : Controller
    {
        private readonly IIdServerUserRepository repo;

        public IdServerUsersController(IIdServerUserRepository repo)
        {
            this.repo = repo;
        }

        /// <summary>
        /// Get a list of all clients.
        /// </summary>
        /// <returns></returns>
        [HttpPost("[action]")]
        [HalRel(CrudRels.List)]
        public Task<IdServerUserCollection> List([FromBody] IdServerUserQuery query)
        {
            return repo.List(query);
        }

        /// <summary>
        /// Get a list of all clients.
        /// </summary>
        /// <returns></returns>
        [HttpGet("[action]/{UserId}")]
        [HalRel(CrudRels.Get)]
        public Task<IdServerUserView> Get(Guid userId)
        {
            return repo.Get(userId);
        }
    }
}

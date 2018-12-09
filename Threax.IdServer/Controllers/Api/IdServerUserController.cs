﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Threax.IdServer.InputModels;
using Threax.IdServer.Models.Api;
using System;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.IdServer.Models;
using Threax.IdServer.Services;

namespace Threax.IdServer.Areas.Api.Controllers
{
    [Authorize(Roles = Roles.ViewIdServerUsers, AuthenticationSchemes = AuthCoreSchemes.Bearer)]
    [Route("api/[controller]")]
    [ResponseCache(NoStore = true)]
    public class IdServerUsersController : Controller
    {
        private readonly UserManager<ApplicationUser> userManager;
        private readonly SignInManager<ApplicationUser> signInManager;
        private readonly ILogger logger;

        public IdServerUsersController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ILoggerFactory loggerFactory)
        {
            this.userManager = userManager;
            this.signInManager = signInManager;
            this.logger = loggerFactory.CreateLogger<IdServerUsersController>();
        }

        /// <summary>
        /// Get a list of all clients.
        /// </summary>
        /// <returns></returns>
        [HttpPost("[action]")]
        [HalRel(CrudRels.List)]
        public async Task<IdServerUserCollection> List([FromBody] IdServerUserQuery query, [FromServices] Data.UsersDbContext userDb)
        {
            var dbQuery = await query.Create(userDb.Users);
            var total = await dbQuery.CountAsync();
            dbQuery = dbQuery.Skip(query.SkipTo(total)).Take(query.Limit);
            var resultQuery = dbQuery.Select(i => new IdServerUserView()
            {
                DisplayName = i.UserName,
                Email = i.Email,
                UserId = TempIdConverter.ConvertId(i.Id),
                UserName = i.UserName
            });
            var results = await resultQuery.ToListAsync();
            return new IdServerUserCollection(query, total, results);
        }

        /// <summary>
        /// Get a list of all clients.
        /// </summary>
        /// <returns></returns>
        [HttpGet("[action]/{UserId}")]
        [HalRel(CrudRels.Get)]
        public async Task<IdServerUserView> Get(Guid userId, [FromServices] Data.UsersDbContext userDb)
        {
            var strUserId = TempIdConverter.ConvertId(userId);//Dont need this temp string if you go all guid
            var user = await userDb.Users.Where(i => i.Id == strUserId).FirstAsync();
            return new IdServerUserView()
            {
                DisplayName = user.UserName,
                Email = user.Email,
                UserId = TempIdConverter.ConvertId(user.Id),
                UserName = user.UserName
            };
        }
    }
}

using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.IdServer.EntityFramework.DbContexts;
using Threax.IdServer.InputModels;
using Threax.IdServer.Models.Api;
using Threax.IdServer.Services;

namespace Threax.IdServer.Repository
{
    public class IdServerUserRepository : IIdServerUserRepository
    {
        private readonly ConfigurationDbContext configDb;
        private readonly IdentityUsersDbContext userDb;
        private readonly IApplicationGuidFactory guidFactory;

        public IdServerUserRepository(
            ConfigurationDbContext configDb, 
            IdentityUsersDbContext userDb, 
            IApplicationGuidFactory guidFactory)
        {
            this.configDb = configDb;
            this.userDb = userDb;
            this.guidFactory = guidFactory;
        }

        /// <summary>
        /// Get a list of all clients.
        /// </summary>
        /// <returns></returns>
        public async Task<IdServerUserCollection> List(IdServerUserQuery query)
        {
            IEnumerable<IdServerUserView> results = new IdServerUserView[0];
            //Count
            var users = query.Create(userDb.Users);
            var userTotal = await users.CountAsync();
            var clientCreds = query.Create(configDb.Clients, guidFactory);
            var clientTotal = await clientCreds.CountAsync();

            //Skip
            var total = userTotal + clientTotal;
            var skip = query.SkipTo(total);
            var limit = query.Limit;

            //Query users
            if (skip < userTotal) //If we are past all of these, don't load them
            {
                users = users.Skip(skip).Take(limit);
                var resultQuery = users.Select(i => new IdServerUserView()
                {
                    DisplayName = i.UserName,
                    Email = i.Email,
                    UserId = TempIdConverter.ConvertId(i.Id),
                    UserName = i.UserName
                });
                results = results.Concat(await resultQuery.ToListAsync());
            }

            //Query client credentials
            if (skip + limit > userTotal) //If we are past the amount of actual users, include applications
            {
                var adjSkip = skip - userTotal;
                if (adjSkip < 0)
                {
                    limit += adjSkip;
                    adjSkip = 0;
                }

                clientCreds = clientCreds.Skip(adjSkip).Take(limit);
                var resultQuery = clientCreds.Select(c => new IdServerUserView()
                {
                    DisplayName = c.Name,
                    UserId = guidFactory.CreateGuid(c),
                    UserName = c.ClientId
                });
                results = results.Concat(await resultQuery.ToListAsync());
            }

            return new IdServerUserCollection(query, total, results);
        }

        /// <summary>
        /// Get a list of all clients.
        /// </summary>
        /// <returns></returns>
        public async Task<IdServerUserView> Get(Guid userId)
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

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.UserLookup;
using Threax.IdServer.Repository;

namespace Threax.IdServer.Services
{
    /// <summary>
    /// This is a custom user search service that just searches inside this app instead of connecting
    /// back to it to search. It could be replaced by some other UserSearchService if needed in Startup.
    /// </summary>
    public class UserSearchService : IUserSearchService
    {
        private IIdServerUserRepository repo;

        public UserSearchService(IIdServerUserRepository repo)
        {
            this.repo = repo;
        }

        public async Task<IUserSearch> Get(Guid userId)
        {
            return await repo.Get(userId);
        }

        public async Task<UserSearchResult> List(IUserSearchQuery query)
        {
            var results = await repo.List(new InputModels.IdServerUserQuery()
            {
                Limit = query.Limit,
                Offset = query.Offset,
                UserId = query.UserId,
                UserName = query.UserName
            });
            return new UserSearchResult()
            {
                Results = results.Items,
                Total = results.Total
            };
        }
    }
}

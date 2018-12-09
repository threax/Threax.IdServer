using Halcyon.HAL.Attributes;
using Microsoft.EntityFrameworkCore;
using SpcIdentityServer.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Models;

namespace SpcIdentityServer.InputModels
{
    [HalModel]
    public class ExternalUserQuery : PagedCollectionQuery
    {
        [UiSearch]
        public Guid? UserId { get; set; }

        [UiSearch]
        public List<Guid> UserIds { get; set; }

        [UiSearch]
        [UiOrder]
        public String UserName { get; set; }

        [UiSearch]
        [UiOrder]
        public String GivenName { get; set; }

        [UiSearch]
        [UiOrder]
        public String Surname { get; set; }

        public Task<IQueryable<ExternalUser>> Create(IQueryable<ExternalUser> query)
        {
            if (UserId != null)
            {
                query = query.Where(i => i.Id == UserId);
                return Task.FromResult(query);
            }

            if (UserIds?.Count > 0)
            {
                query = query.Where(i => UserIds.Contains(i.Id));
                return Task.FromResult(query);
            }

            if(UserName != null)
            {
                query = query.Where(i => EF.Functions.Like(i.UserName, $"%{UserName}%"));
            }

            if (GivenName != null)
            {
                query = query.Where(i => EF.Functions.Like(i.FirstName, $"%{GivenName}%"));
            }

            if (Surname != null)
            {
                query = query.Where(i => EF.Functions.Like(i.LastName, $"%{Surname}%"));
            }

            return Task.FromResult(query);
        }
    }
}

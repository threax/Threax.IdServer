using Halcyon.HAL.Attributes;
using Microsoft.EntityFrameworkCore;
using SpcIdentityServer.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Models;
using Threax.IdServer.Models;
using Threax.IdServer.Services;

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

        public Task<IQueryable<ApplicationUser>> Create(IQueryable<ApplicationUser> query)
        {
            if (UserId != null)
            {
                var strUserId = TempIdConverter.ConvertId(UserId.Value);//Dont need this temp string if you go all guid
                query = query.Where(i => i.Id == strUserId);
                return Task.FromResult(query);
            }

            if (UserIds?.Count > 0)
            {
                var strUserIds = UserIds.Select(i => TempIdConverter.ConvertId(i)).ToList(); //Dont need this temp list if you go all guid
                query = query.Where(i => strUserIds.Contains(i.Id));
                return Task.FromResult(query);
            }

            if(UserName != null)
            {
                query = query.Where(i => EF.Functions.Like(i.UserName, $"%{UserName}%"));
            }

            return Task.FromResult(query);
        }
    }
}

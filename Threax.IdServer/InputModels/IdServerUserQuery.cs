﻿using Halcyon.HAL.Attributes;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Models;
using Threax.IdServer.EntityFramework.Entities;
using Threax.IdServer.Models;
using Threax.IdServer.Services;

namespace Threax.IdServer.InputModels
{
    [HalModel]
    public class IdServerUserQuery : PagedCollectionQuery
    {
        [UiSearch]
        public Guid? UserId { get; set; }

        [UiSearch]
        public List<Guid> UserIds { get; set; }

        [UiSearch]
        [UiOrder]
        public String UserName { get; set; }

        public IQueryable<Client> Create(IQueryable<Client> query, IApplicationGuidFactory guidFactory)
        {
            query = query.Where(i => (i.AllowedGrantTypes & GrantTypes.ClientCredentials) == GrantTypes.ClientCredentials);

            if (UserId != null)
            {
                return query.Where(i => guidFactory.CreateGuid(i) == UserId);
            }

            if (UserIds?.Count > 0)
            {
                return query.Where(i => UserIds.Contains(guidFactory.CreateGuid(i)));
            }

            if (UserName != null)
            {
                query = query.Where(i => EF.Functions.Like(i.ClientId, $"%{UserName}%"));
            }

            return query;
        }

        public IQueryable<ApplicationUser> Create(IQueryable<ApplicationUser> query)
        {
            if (UserId != null)
            {
                var strUserId = TempIdConverter.ConvertId(UserId.Value);//Dont need this temp string if you go all guid
                query = query.Where(i => i.Id == strUserId);
                return query;
            }

            if (UserIds?.Count > 0)
            {
                var strUserIds = UserIds.Select(i => TempIdConverter.ConvertId(i)).ToList(); //Dont need this temp list if you go all guid
                query = query.Where(i => strUserIds.Contains(i.Id));
                return query;
            }

            if(UserName != null)
            {
                query = query.Where(i => EF.Functions.Like(i.UserName, $"%{UserName}%"));
            }

            return query;
        }
    }
}

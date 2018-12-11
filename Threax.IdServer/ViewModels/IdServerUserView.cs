using Halcyon.HAL.Attributes;
using System;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.UserLookup;
using Threax.IdServer.Areas.Api.Controllers;

namespace Threax.IdServer.Models.Api
{
    [HalModel]
    [HalSelfActionLink(typeof(IdServerUsersController), nameof(IdServerUsersController.Get))]
    public class IdServerUserView : IUserSearch
    {
        public Guid UserId { get; set; }

        public string UserName { get; set; }

        public string DisplayName { get; set; }

        public string GivenName { get; set; }

        public string Surname { get; set; }

        public string Email { get; set; }
    }
}

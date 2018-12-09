using Halcyon.HAL.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.IdServer.Areas.Api.Controllers;

namespace Threax.IdServer.Models.Api
{
    [HalModel]
    [HalSelfActionLink(typeof(IdServerUsersController), nameof(IdServerUsersController.Get))]
    public class IdServerUserView
    {
        public Guid UserId { get; set; }

        public string UserName { get; set; }

        public string DisplayName { get; set; }

        public string GivenName { get; set; }

        public string Surname { get; set; }

        public string Email { get; set; }
    }
}

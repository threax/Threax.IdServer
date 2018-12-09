using Halcyon.HAL.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.UserBuilder.Entities.Mvc;
using Threax.IdServer.Areas.Api.Controllers;

namespace Threax.IdServer
{
    public class Roles
    {
        public const String EditClients = "EditClients";
        public const String EditApiResources = "EditApiResources";
        public const String ViewIdServerUsers = "ViewIdServerUsers";

        public static IEnumerable<String> DatabaseRoles()
        {
            yield return EditClients;
            yield return EditApiResources;
            yield return ViewIdServerUsers;
        }
    }

    [HalModel]
    [HalSelfActionLink(RolesControllerRels.GetUser, typeof(RolesController))]
    [HalActionLink(RolesControllerRels.SetUser, typeof(RolesController))]
    [HalActionLink(RolesControllerRels.DeleteUser, typeof(RolesController))]
    public class RoleAssignments : ReflectedRoleAssignments
    {
        public bool EditClients { get; set; }

        public bool EditApiResources { get; set; }

        public bool ViewIdServerUsers { get; set; }
    }
}

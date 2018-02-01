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

        public static IEnumerable<String> DatabaseRoles()
        {
            yield return EditClients;
            yield return EditApiResources;
        }
    }

    [HalModel]
    [HalSelfActionLink(RolesControllerRels.GetUser, typeof(RolesController))]
    [HalActionLink(RolesControllerRels.SetUser, typeof(RolesController))]
    [HalActionLink(RolesControllerRels.DeleteUser, typeof(RolesController))]
    public class RoleAssignments : ReflectedRoleAssignments
    {
        [Display(Name="Edit Clients")]
        public bool EditClients { get; set; }

        [Display(Name = "Edit Api Resources")]
        public bool EditApiResources { get; set; }
    }
}

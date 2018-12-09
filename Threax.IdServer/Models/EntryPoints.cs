using Halcyon.HAL.Attributes;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.UserBuilder.Entities.Mvc;
using Threax.AspNetCore.UserSearchMvc.Controllers;
using Threax.IdServer.Areas.Api.Controllers;

namespace Threax.IdServer.Areas.Api.Models
{
    /// <summary>
    /// This class returns the entry points to the system using hal links.
    /// </summary>
    [HalModel]
    [HalEntryPoint]
    [HalSelfActionLink(EntryPointController.Rels.Get, typeof(EntryPointController))]

    [HalActionLink(ClientController.Rels.List, typeof(ClientController))]
    [HalActionLink(ClientController.Rels.Add, typeof(ClientController))]
    [HalActionLink(ClientController.Rels.Update, typeof(ClientController))]
    [HalActionLink(ClientController.Rels.Delete, typeof(ClientController))]
    [HalActionLink(ClientController.Rels.LoadFromMetadata, typeof(ClientController))]
    [HalActionLink(typeof(ClientController), nameof(ClientController.FromClientCredentialsMetadata), "LoadFromClientCredentialsMetadata")]
    [HalActionLink(ClientController.Rels.Secret, typeof(ClientController))]

    [HalActionLink(ApiResourceController.Rels.List, typeof(ApiResourceController))]
    [HalActionLink(ApiResourceController.Rels.Add, typeof(ApiResourceController))]
    [HalActionLink(ApiResourceController.Rels.Update, typeof(ApiResourceController))]
    [HalActionLink(ApiResourceController.Rels.Delete, typeof(ApiResourceController))]
    [HalActionLink(ApiResourceController.Rels.LoadFromMetadata, typeof(ApiResourceController))]

    //[HalActionLink(typeof(ExternalUsersController), nameof(ExternalUsersController.BeginRegister), "BeginRegister")]

    [HalActionLink(RolesControllerRels.GetUser, typeof(RolesController))]
    [HalActionLink(RolesControllerRels.ListUsers, typeof(RolesController))]
    [HalActionLink(RolesControllerRels.SetUser, typeof(RolesController))]
    [HalActionLink(typeof(IdServerUsersController), nameof(IdServerUsersController.List), "ListIdServerUsers")]
    [HalActionLink(typeof(UserSearchController), nameof(UserSearchController.List), "ListAppUsers")]
    public class EntryPoints
    {
    }
}

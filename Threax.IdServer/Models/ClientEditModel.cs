using Halcyon.HAL.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.IdServer.Areas.Api.Controllers;
using Threax.IdServer.EntityFramework.Entities;

namespace Threax.IdServer.Areas.Api.Models
{
    [DisplayName("Client")]
    [HalModel]
    [HalSelfActionLink(ClientController.Rels.Get, typeof(ClientController))]
    [HalActionLink(CrudRels.Update, ClientController.Rels.Update, typeof(ClientController))]
    [HalActionLink(CrudRels.Delete, ClientController.Rels.Delete, typeof(ClientController))]
    [HalActionLink(ClientController.Rels.Secret, typeof(ClientController))]
    public class ClientEditModel
    {
        /// <summary>
        /// The id of the client.
        /// </summary>
        [DisplayName("Id")]
        [ReadOnly(true)]
        public int Id { get; set; }

        [DisplayName("Client Id")]
        [Required]
        public String ClientId { get; set; }

        [DisplayName("Name")]
        [Required]
        public String Name { get; set; }

        [DisplayName("Logout Uri")]
        public String LogoutUri { get; set; }

        [DisplayName("Allowed Grant Types")]
        public List<GrantTypes> AllowedGrantTypes { get; set; }

        [DisplayName("Redirect Uris")]
        public List<String> RedirectUris { get; set; } = new List<string>();

        [DisplayName("Allowed Scopes")]
        public List<String> AllowedScopes { get; set; } = new List<string>();

        [DisplayName("Access Token Lifetime")]
        public int AccessTokenLifetime { get; set; } = 3600;

        /// <summary>
        /// This Guid is used to identify the client when it is logging in as an application user.
        /// That is the only time it is used, the integer id is the real id of the item when
        /// editing.
        /// </summary>
        [DisplayName("Application Guid")]
        [ReadOnly(true)]
        public Guid ApplicationGuid { get; set; }
    }
}

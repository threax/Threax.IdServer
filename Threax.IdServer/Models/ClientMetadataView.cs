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
    [HalModel]
    [HalSelfActionLink(ClientController.Rels.LoadFromMetadata, typeof(ClientController))]
    public class ClientMetadataView// : IClientMetadata
    {
        [DisplayName("Client Id")]
        [Required]
        public String ClientId { get; set; }

        [DisplayName("Name")]
        [Required]
        public String Name { get; set; }

        [DisplayName("Logout Uri")]
        public String LogoutUri { get; set; }

        [DisplayName("Allowed Grant Types")]
        public List<GrantTypes> AllowedGrantTypes { get; set; } = new List<GrantTypes>();

        [DisplayName("Redirect Uris")]
        public List<String> RedirectUris { get; set; } = new List<string>();

        [DisplayName("Allowed Scopes")]
        public List<String> AllowedScopes { get; set; } = new List<string>();

        [DisplayName("Access Token Lifetime")]
        public int AccessTokenLifetime { get; set; } = 3600;
    }
}

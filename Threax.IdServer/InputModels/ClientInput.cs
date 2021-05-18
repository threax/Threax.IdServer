using Halcyon.HAL.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Threax.AspNetCore.Models;
using Threax.IdServer.EntityFramework.Entities;

namespace Threax.IdServer.Areas.Api.InputModels
{
    [HalModel]
    public class ClientInput// : ClientMetadata
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
        [CheckboxUiType]
        public List<GrantTypes> AllowedGrantTypes { get; set; }

        [DisplayName("Redirect Uris")]
        public List<String> RedirectUris { get; set; } = new List<string>();

        [DisplayName("Allowed Scopes")]
        public List<String> AllowedScopes { get; set; } = new List<string>();

        [DisplayName("Access Token Lifetime")]
        public int AccessTokenLifetime { get; set; } = 3600;
    }
}

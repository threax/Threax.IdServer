using Halcyon.HAL.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Threax.AspNetCore.Halcyon.Ext.ValueProviders;
using Threax.AspNetCore.IdServerMetadata;
using Threax.AspNetCore.Models;
using IdentityServer4.EntityFramework.Entities;

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

        [DisplayName("Logout Session Required")]
        public bool LogoutSessionRequired { get; set; } = true;

        [DisplayName("Allowed Grant Types")]
        [CheckboxUiType]
        public GrantTypes AllowedGrantTypes { get; set; }

        [DisplayName("Redirect Uris")]
        public List<String> RedirectUris { get; set; } = new List<string>();

        [DisplayName("Allowed Scopes")]
        public List<String> AllowedScopes { get; set; } = new List<string>();

        [DisplayName("Allow External Users")]
        public bool EnableLocalLogin { get; set; }

        [DisplayName("Access Token Lifetime")]
        public int AccessTokenLifetime { get; set; } = 3600;
    }
}

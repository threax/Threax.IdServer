using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace IdentityServer4.EntityFramework.Entities
{
    [Flags]
    public enum GrantTypes
    {
        [Display(Name = "Hybrid")]
        Hybrid = 1 << 0,
        [Display(Name = "Client Credentials")]
        ClientCredentials = 1 << 1,
        [Display(Name = "Authorization Code")]
        AuthorizationCode = 1 << 2
    }
}

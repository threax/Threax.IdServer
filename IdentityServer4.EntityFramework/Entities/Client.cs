﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace IdentityServer4.EntityFramework.Entities
{
    public class Client
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(200)]
        public String ClientId { get; set; }

        [MaxLength(200)]
        public String Name { get; set; }

        [MaxLength(2000)]
        public String LogoutUri { get; set; }

        [MaxLength(2000)]
        public bool LogoutSessionRequired { get; set; } = true;

        public GrantTypes AllowedGrantTypes { get; set; }

        public List<ClientRedirectUri> RedirectUris { get; set; } = new List<ClientRedirectUri>();

        public List<ClientScope> AllowedScopes { get; set; } = new List<ClientScope>();

        public List<ClientSecret> ClientSecrets { get; set; } = new List<ClientSecret>();

        public bool EnableLocalLogin { get; set; }

        public int AccessTokenLifetime { get; set; } = 3600;
    }
}

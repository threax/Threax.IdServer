using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace IdentityServer4.EntityFramework.Entities
{
    public class ClientSecret
    {
        [Key]
        public Guid ClientSecretId { get; set; }

        [MaxLength(2000)]
        public String Secret { get; set; }
    }
}

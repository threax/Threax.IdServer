using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace IdentityServer4.EntityFramework.Entities
{
    public class ClientSecret
    {
        public String Secret { get; set; }
    }
}

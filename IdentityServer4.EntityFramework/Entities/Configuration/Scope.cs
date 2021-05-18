using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace IdentityServer4.EntityFramework.Entities
{
    [Table("Scopes")]
    public class Scope
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(1000)]
        public String Name { get; set; }

        [MaxLength(1000)]
        public String DisplayName { get; set; }
    }
}

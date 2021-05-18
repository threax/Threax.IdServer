using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Threax.IdServer.EntityFramework.Entities
{
    [Table("ClientRedirectUri")]
    public class ClientRedirectUri
    {
        [Key]
        public Guid ClientRedirectUriId { get; set; }
        public int ClientId { get; set; }

        public Client Client { get; set; }

        [MaxLength(2000)]
        public String Uri { get; set; }
    }
}

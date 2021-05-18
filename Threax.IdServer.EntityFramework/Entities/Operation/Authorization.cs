using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Threax.IdServer.EntityFramework.Entities
{
    public class Authorization
    {
        [Key]
        public Guid AuthorizationId { get; set; }

        public int ApplicationId { get; set; }

        [MaxLength(1000)]
        public string Subject { get; set; }

        [MaxLength(1000)]
        public string Client { get; set; }

        [MaxLength(1000)]
        public string Status { get; set; }

        [MaxLength(1000)]
        public string Type { get; set; }

        public string ScopesJson { get; set; }

        public DateTime? Created { get; set; }

        public IEnumerable<Token> Tokens { get; set; }

        public void CopyTo(Authorization target)
        {
            target.ApplicationId = this.ApplicationId;
            target.Subject = this.Subject;
            target.Client = this.Client;
            target.Status = this.Status;
            target.Type = this.Type;
            target.ScopesJson = this.ScopesJson;
            target.Created = this.Created;
        }
    }
}

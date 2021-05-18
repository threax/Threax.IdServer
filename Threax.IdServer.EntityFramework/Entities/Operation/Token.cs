using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Threax.IdServer.EntityFramework.Entities
{
    public class Token
    {
        [Key]
        public Guid TokenId { get; set; }

        public Guid? AuthorizationId { get; set; }

        public int ApplicationId { get; set; }

        [MaxLength(400)]
        public string Subject { get; set; }

        [MaxLength(50)]
        public string Status { get; set; }

        [MaxLength(50)]
        public string Type { get; set; }

        /// <summary>
        /// Gets or sets the reference identifier associated
        /// with the current token, if applicable.
        /// Note: this property is only used for reference tokens
        /// and may be hashed or encrypted for security reasons.
        /// </summary>
        [MaxLength(100)]
        public string ReferenceId { get; set; }

        /// <summary>
        /// Gets or sets the payload of the current token, if applicable.
        /// Note: this property is only used for reference tokens
        /// and may be encrypted for security reasons.
        /// </summary>
        public virtual string Payload { get; set; }

        /// <summary>
        /// Gets or sets the UTC redemption date of the current token.
        /// </summary>
        public virtual DateTime? RedemptionDate { get; set; }

        public Authorization Authorization { get; set; }

        public DateTime? Created { get; set; }

        public DateTime? Expires { get; set; }

        internal void CopyTo(Token target)
        {
            target.ApplicationId = this.ApplicationId;
            target.AuthorizationId = this.AuthorizationId;
            target.Created = this.Created;
            target.Expires = this.Expires;
            target.Payload = this.Payload;
            target.RedemptionDate = this.RedemptionDate;
            target.ReferenceId = this.ReferenceId;
            target.Status = this.Status;
            target.Subject = this.Subject;
            target.TokenId = this.TokenId;
            target.Type = this.Type;
        }
    }
}

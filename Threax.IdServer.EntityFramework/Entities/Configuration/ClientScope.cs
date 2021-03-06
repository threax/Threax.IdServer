﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Threax.IdServer.EntityFramework.Entities
{
    [Table("ClientScope")]
    public class ClientScope
    {
        [Key]
        public Guid ClientScopeId { get; set; }
        public int ClientId { get; set; }

        public Client Client { get; set; }

        [MaxLength(2000)]
        public String Scope { get; set; }
    }
}

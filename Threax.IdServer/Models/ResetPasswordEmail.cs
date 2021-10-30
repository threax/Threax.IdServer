using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Threax.IdServer.Models
{
    public class ResetPasswordEmail
    {
        public String Token { get; set; }

        public String Email { get; set; }
    }
}

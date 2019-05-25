using IdentityServer4.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Threax.IdServer
{
    public static class DefaultSecret
    {
        public static readonly String Secret = "notyetdefined".Sha256();
    }
}

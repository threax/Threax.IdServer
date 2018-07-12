using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.IdServer.Controllers;

namespace Microsoft.AspNetCore.Mvc
{
    public static class UrlHelperExtensions
    {
        public static string EmailConfirmationLink(this IUrlHelper urlHelper, string userId, string code, string scheme)
        {
            throw new NotSupportedException();
        }

        public static string ResetPasswordCallbackLink(this IUrlHelper urlHelper, string userId, string code, string scheme)
        {
            throw new NotSupportedException();
        }
    }
}

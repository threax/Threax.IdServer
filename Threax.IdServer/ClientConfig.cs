using HtmlRapier.TagHelpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Threax.IdServer
{
    public class ClientConfig : ClientConfigBase
    {
        /// <summary>
        /// The url of the app's service, likely the same as the app itself.
        /// </summary>
        public string ServiceUrl { get; set; }

        [ExpandHostPath]
        public string AccessTokenPath { get; set; } = "~/Account/AccessToken";

        /// <summary>
        /// The path to the bearer cookie. Move this somewhere else
        /// </summary>
        public String BearerCookieName { get; set; }
    }
}

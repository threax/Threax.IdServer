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

        /// <summary>
        /// The url of the user directory to lookup users from.
        /// </summary>
        public String UserDirectoryUrl { get; set; }
    }
}

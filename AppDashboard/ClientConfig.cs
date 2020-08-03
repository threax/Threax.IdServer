using HtmlRapier.TagHelpers;
using System;

namespace AppDashboard
{
    /// <summary>
    /// Settings specific to the AppDashboard application. Don't put secret info
    /// in here as it is sent to the client also.
    /// </summary>
    public class ClientConfig : ClientConfigBase
    {
        /// <summary>
        /// The base url of the identity service to modify.
        /// </summary>
        public String IdentityServerHost { get; set; } = "Set this to something";

        [ExpandHostPath]
        public string AccessTokenPath { get; set; } = "~/Account/AccessToken";

        /// <summary>
        /// The path to the bearer cookie. Move this somewhere else
        /// </summary>
        public String BearerCookieName { get; set; }
    }
}

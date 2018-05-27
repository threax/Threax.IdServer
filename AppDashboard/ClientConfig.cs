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

        /// <summary>
        /// The base url of the user directory service.
        /// </summary>
        public String UserDirectoryHost { get; set; } = "Set this to something";
    }
}

﻿namespace TestMvcApp
{
    /// <summary>
    /// The configuration for this app.
    /// </summary>
    public class AppConfig
    {
        /// <summary>
        /// The base path the app lives on. Used for cookie paths and to enforce the url spelling.
        /// Can be null to live on the root path.
        /// </summary>
        public string PathBase { get; set; }

        /// <summary>
        /// Should the api explorer be accessible, false by default. The api explorer is pure client side
        /// and will not expose methods the user cannot access on the service, so if I hit the explorer page
        /// logged in vs logged out it will behave differently. That said it is probably best to leave this
        /// off in production.
        /// </summary>
        public bool AllowApiExplorer { get; set; }
    }
}
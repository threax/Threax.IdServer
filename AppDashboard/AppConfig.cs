﻿using System;

namespace OlsAppDashboard
{
    public class AppConfig
    {
        public AppConfig()
        {
        }

        /// <summary>
        /// True to enable debug logging.
        /// </summary>
        public bool EnableDebugLogging { get; set; }

        /// <summary>
        /// The Path Base for the url. The path base url written here will be forced by the
        /// UrlFix middleware, it will also be used as the cookie path.
        /// </summary>
        public String PathBase { get; set; }

        /// <summary>
        /// Set this to true to use asset bundles instead of individual client side files.
        /// </summary>
        public bool UseAssetBundles { get; set; } = false;
    }
}
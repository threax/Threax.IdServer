using System;

namespace AppDashboard
{
    public class AppConfig
    {
        public AppConfig()
        {
        }

        /// <summary>
        /// The Path Base for the url. The path base url written here will be forced by the
        /// UrlFix middleware, it will also be used as the cookie path.
        /// </summary>
        public String PathBase { get; set; }

        /// <summary>
        /// Set this to true to use asset bundles instead of individual client side files.
        /// </summary>
        public bool UseAssetBundles { get; set; } = false;

        /// <summary>
        /// The token to use as a cache token. This is a unique id for a particular website build. If this is null a hash
        /// of the main library that contains Startup.cs will be used. You can set this to something unique like your
        /// build number and that will ensure the cache always invalidates with each new release. Do not use the same
        /// value for multiple releases, or clients will never update their caches. You can set this to 'nocache' to totally
        /// disable the cache. Default: null (use assembly hash)
        /// </summary>
        public string CacheToken { get; set; } = null; //(use assembly hash)

        /// <summary>
        /// Set this to the string to use for the cache-control header on anything that is cached.
        /// Default: 'private, max-age=2592000, stale-while-revalidate=86400, immutable'
        /// </summary>
        public string CacheControlHeaderString { get; set; } = "private, max-age=2592000, stale-while-revalidate=86400, immutable";

        /// <summary>
        /// Set this to true to cache static assets like javascript and css files.
        /// </summary>
        public bool CacheStaticAssets { get; set; } = true;

        /// <summary>
        /// Set this to true to enable response compression from inside this application directly.
        /// If this is enabled it really only applies to static assets. The razor views are not
        /// compressed and neither are the api results due to issues with https and compression.
        /// Default: false (no compression)
        /// </summary>
        public bool EnableResponseCompression { get; set; } = false;

        /// <summary>
        /// Set this to a path to load for the KeyPerFile config. This can be null to load nothing.
        /// If this is set the path is required.
        /// </summary>
        public string KeyPerFilePath { get; set; }

        /// <summary>
        /// Add the user secrets. Useful during development, otherwise disable.
        /// </summary>
        public bool AddUserSecrets { get; set; }
    }
}
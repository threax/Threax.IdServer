using MailKit.Security;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Threax.IdServer
{
    public class AppConfig
    {
        /// <summary>
        /// The base url of the application, by default automatically discovered.
        /// </summary>
        public string BaseUrl { get; set; } = HalcyonConventionOptions.HostVariable;

        /// <summary>
        /// The connection string for the app's primary database with user information. This is also used if any of the other
        /// db connection strings are not provided.
        /// </summary>
        public string ConnectionString { get; set; }

        /// <summary>
        /// The connection string to the database with the id server configuration. Can be null to use ConnectionString.
        /// </summary>
        public string ConfigurationConnectionString { get; set; }

        /// <summary>
        /// The connection string to the id server operational data like persisted grants. Can be null to use ConnectionString.
        /// </summary>
        public string OperationalConnectionString { get; set; }

        /// <summary>
        /// True to turn on detailed error messages. Default: false.
        /// </summary>
        public bool DetailedErrors { get; set; }

        /// <summary>
        /// True to enable the error pages. Default: false.
        /// </summary>
        public bool ErrorPages { get; set; }

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

        /// <summary>
        /// Set this to true to use asset bundles instead of individual client side files.
        /// </summary>
        public bool UseAssetBundles { get; set; } = false;

        /// <summary>
        /// The server signing credentials certififcate thumbprint. Must be stored in LocalMachine -> My.
        /// It can also be a file on the filesystem or the name of a key in the configuration holding a base64 version of the cert.
        /// Search order is filesystem, config, machine storage.
        /// </summary>
        public string SigningCredentialCertThumb { get; set; }

        /// <summary>
        /// The server rollover certififcate thumbprint. Must be stored in LocalMachine -> My.
        /// It can also be a file on the filesystem or the name of a key in the configuration holding a base64 version of the cert.
        /// Search order is filesystem, config, machine storage.
        /// </summary>
        public string RolloverCertThumb { get; set; }

        /// <summary>
        /// Set this to true (default) to load the signing certs when starting the app. This is only reccomended to disable in tools mode.
        /// </summary>
        public bool LoadSigningCerts { get; set; } = true;

        /// <summary>
        /// The values for the frame-ancestors CSP directive. Each entry is an item in the array.
        /// Self is already included.
        /// </summary>
        public List<String> FrameAncestors { get; set; }

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
        /// The plain text default secret that will be used when adding clients without any secrets provided.
        /// It can be overwritten to make that value itself non-public. Default: 'notyetdefined'
        /// </summary>
        public String DefaultSecret { get; set; } = "notyetdefined";

        /// <summary>
        /// The path to store data protection keys.
        /// </summary>
        public String DataProtectionKeysPath { get; set; }

        /// <summary>
        /// Set this to true to add user secrets. Good for development. Default: false
        /// </summary>
        public bool AddUserSecrets { get; set; }

        /// <summary>
        /// Set this to true to ShowPII in the logs.
        /// </summary>
        public bool ShowPII { get; set; }

        /// <summary>
        /// Set the app db schema name.
        /// </summary>
        public string DbSchema { get; set; } = "dbo";

        /// <summary>
        /// Config for e-mail.
        /// </summary>
        public EmailConfig Email { get; set; } = new EmailConfig();
    }

    public class EmailConfig
    {
        public bool Enabled { get; set; }

        public String FromName { get; set; }

        public String FromEmail { get; set; }

        public SecureSocketOptions SslOptions { get; set; } = SecureSocketOptions.Auto;

        public string Host { get; set; }

        public int Port { get; set; } = 465;

        public bool UseAuthentication { get; set; }

        public String User { get; set; }

        public String Password { get; set; }
    }
}

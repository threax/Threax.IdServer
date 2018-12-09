using Newtonsoft.Json;
using System;
using Threax.AspNetCore.Halcyon.Client;

namespace Threax.IdServer.Client
{
    public class SpcIdentityServerOptions
    {
        /// <summary>
        /// The url of the service.
        /// </summary>
        public string ServiceUrl { get; set; }

        /// <summary>
        /// The options when using ClientCredentials, otherwise ignored.
        /// </summary>
        public ClientCredentailsAccessTokenFactoryOptions ClientCredentials { get; set; } = new ClientCredentailsAccessTokenFactoryOptions();

        /// <summary>
        /// If ClientCredentials is null and this is set to a function the client credentials setup by the callback will be used.
        /// </summary>
        [JsonIgnore]
        public Action<SharedClientCredentials> GetSharedClientCredentials { get; set; }
    }
}

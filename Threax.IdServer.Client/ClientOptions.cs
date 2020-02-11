using Newtonsoft.Json;
using System;
using Threax.AspNetCore.Halcyon.Client;

namespace Threax.IdServer.Client
{
    public class ClientOptions
    {
        /// <summary>
        /// The url of the service.
        /// </summary>
        public string ServiceUrl { get; set; }
    }
}

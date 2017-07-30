using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Threax.AspNetCore.CorsManager
{
    public class CorsManagerOptions
    {
        /// <summary>
        /// Fully remove all CORS protection from this website. Not reccomended for production.
        /// </summary>
        public bool UnlimitedAccess { get; set; }

        public List<String> AllowedOrigins { get; set; }
    }
}

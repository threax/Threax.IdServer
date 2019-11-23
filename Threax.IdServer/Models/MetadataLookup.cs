using Halcyon.HAL.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Threax.IdServer.Areas.Api.Models
{
    /// <summary>
    /// A model class for looking up metadata.
    /// </summary>
    [HalModel]
    public class MetadataLookup
    {
        /// <summary>
        /// The url to lookup metadata from.
        /// </summary>
        public String TargetUrl { get; set; }

        public String GetFixedTargetUrl()
        {
            var url = TargetUrl;
            if (url.EndsWith('/') || url.EndsWith('\\'))
            {
                url = url.Substring(0, url.Length - 1);
            }

            return url;
        }
    }
}

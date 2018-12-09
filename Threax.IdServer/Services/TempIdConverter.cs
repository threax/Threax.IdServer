using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Threax.IdServer.Services
{
    /// <summary>
    /// This acts as an id converter for the string based ids we have right now.
    /// It is not ideal, but its not used that often. This needs to be fixed at
    /// some point.
    /// </summary>
    public static class TempIdConverter
    {
        public static String ConvertId(Guid id)
        {
            return id.ToString();
        }

        public static Guid ConvertId(String id)
        {
            return Guid.Parse(id);
        }
    }
}

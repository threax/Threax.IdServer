using Logos.Utility;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Threax.IdServer.Services
{
    public class ApplicationGuidFactory : IApplicationGuidFactory
    {
        private Guid guidNamespace;

        public ApplicationGuidFactory(Guid guidNamespace)
        {
            this.guidNamespace = guidNamespace;
        }

        public Guid CreateGuid(IdentityServer4.Models.Client client)
        {
            return GuidUtility.Create(guidNamespace, client.ClientId);
        }

        public Guid CreateGuid(IdentityServer4.EntityFramework.Entities.Client client)
        {
            return GuidUtility.Create(guidNamespace, client.ClientId);
        }
    }
}

using Logos.Utility;
using System;
using Threax.IdServer.EntityFramework.Entities;

namespace Threax.IdServer.Services
{
    public class ApplicationGuidFactory : IApplicationGuidFactory
    {
        private Guid guidNamespace;

        public ApplicationGuidFactory(Guid guidNamespace)
        {
            this.guidNamespace = guidNamespace;
        }

        public Guid CreateGuid(Client client)
        {
            return GuidUtility.Create(guidNamespace, client.ClientId);
        }
    }
}

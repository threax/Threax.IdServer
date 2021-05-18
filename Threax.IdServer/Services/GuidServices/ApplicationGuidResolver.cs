using AutoMapper;
using System;
using Threax.IdServer.Areas.Api.Models;
using Threax.IdServer.EntityFramework.Entities;

namespace Threax.IdServer.Services
{
    public class ApplicationGuidResolver : IValueResolver<Client, ClientEditModel, Guid>
    {
        private IApplicationGuidFactory guidFactory;

        public ApplicationGuidResolver(IApplicationGuidFactory guidFactory)
        {
            this.guidFactory = guidFactory;
        }

        public Guid Resolve(Client source, ClientEditModel destination, Guid destMember, ResolutionContext context)
        {
            return guidFactory.CreateGuid(source);
        }
    }
}

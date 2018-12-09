using AutoMapper;
using IdentityServer4.EntityFramework.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.IdServer.Areas.Api.Models;

namespace Threax.IdServer.Services
{
    public class ApplicationGuidResolver : IValueResolver<IdentityServer4.EntityFramework.Entities.Client, ClientEditModel, Guid>
    {
        private IApplicationGuidFactory guidFactory;

        public ApplicationGuidResolver(IApplicationGuidFactory guidFactory)
        {
            this.guidFactory = guidFactory;
        }

        public Guid Resolve(IdentityServer4.EntityFramework.Entities.Client source, ClientEditModel destination, Guid destMember, ResolutionContext context)
        {
            return guidFactory.CreateGuid(source);
        }
    }
}

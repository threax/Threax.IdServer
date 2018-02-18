using AutoMapper;
using IdentityServer4.EntityFramework.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.IdServer.Areas.Api.Models;

namespace Threax.IdServer.Mappers
{
    public class ApiResourceProfile : Profile
    {
        public ApiResourceProfile()
        {
            CreateMap<ApiResource, ApiResourceEditModel>()
                .ForMember(d => d.ScopeName, opt => opt.ResolveUsing((s, d) => s.Scopes.FirstOrDefault()?.Name));
        }
    }
}

using AutoMapper;
using IdentityServer4.EntityFramework.Entities;
using Threax.IdServer.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.IdServerMetadata;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Areas.Api.Models;

namespace Threax.IdServer.Mappers
{
    public class ApiResourceProfile : Profile
    {
        public ApiResourceProfile()
        {
            CreateMap<ClientMetadata, ClientMetadataView>();
            CreateMap<ApiResourceMetadata, ApiResourceMetadataView>();

            //These allow us to go straight from client metadata to the input. This is so the tools mode can use it.
            CreateMap<ClientMetadata, ClientInput>();
            CreateMap<ApiResourceMetadata, ApiResourceInput>();

            CreateMap<List<String>, List<GrantTypes>>()
                .ConvertUsing((s, d) =>
                {
                    if(s == null)
                    {
                        return null;
                    }

                    var grantTypes = new List<GrantTypes>();
                    foreach(var i in s)
                    {
                        switch (i.ToLowerInvariant())
                        {
                            case "client_credentials":
                                grantTypes.Add(GrantTypes.ClientCredentials);
                                break;
                            case "hybrid":
                                grantTypes.Add(GrantTypes.Hybrid);
                                break;
                            case "authorization_code":
                                grantTypes.Add(GrantTypes.AuthorizationCode);
                                break;
                        }
                    }
                    return grantTypes;
                });

            CreateMap<ApiResourceInput, Scope>()
                .ForMember(d => d.Id, opt => opt.Ignore())
                .ForMember(d => d.Name, opt => opt.MapFrom(s => s.ScopeName))
                .ForMember(d => d.DisplayName, opt => opt.MapFrom(s => s.DisplayName));

            CreateMap<Scope, ApiResourceEditModel>()
                .ForMember(d => d.ScopeName, opt => opt.MapFrom(s => s.Name));

            CreateMap<ClientInput, IdentityServer4.EntityFramework.Entities.Client>()
                .ForMember(d => d.Id, opt => opt.Ignore())
                .ForMember(d => d.ClientSecrets, opt => opt.Ignore())
                .ForMember(d => d.AllowedGrantTypes, o => o.MapFrom((ClientInput s, IdentityServer4.EntityFramework.Entities.Client d) =>
                {
                    GrantTypes result = (GrantTypes)0;
                    foreach(var type in s.AllowedGrantTypes)
                    {
                        result |= type;
                    }

                    return result;
                }))
                .ForMember(d => d.RedirectUris, opt => opt.MapFrom((ClientInput s, IdentityServer4.EntityFramework.Entities.Client d) =>
                {
                    return s.RedirectUris.Select(i => new ClientRedirectUri()
                    {
                        Uri = i
                    });
                }))
                .ForMember(d => d.AllowedScopes, opt => opt.MapFrom((ClientInput s, IdentityServer4.EntityFramework.Entities.Client d) =>
                {
                    return s.AllowedScopes.Select(i => new ClientScope()
                    {
                        Scope = i
                    });
                }));

            CreateMap<IdentityServer4.EntityFramework.Entities.Client, ClientEditModel>()
                .ForMember(d => d.ApplicationGuid, opt => opt.MapFrom<ApplicationGuidResolver>())
                .ForMember(d => d.AllowedGrantTypes, o => o.MapFrom((IdentityServer4.EntityFramework.Entities.Client s, ClientEditModel d) =>
                {
                    var grantTypes = new List<GrantTypes>();
                    if((s.AllowedGrantTypes & GrantTypes.AuthorizationCode) != 0)
                    {
                        grantTypes.Add(GrantTypes.AuthorizationCode);
                    }
                    if ((s.AllowedGrantTypes & GrantTypes.Hybrid) != 0)
                    {
                        grantTypes.Add(GrantTypes.Hybrid);
                    }
                    if ((s.AllowedGrantTypes & GrantTypes.ClientCredentials) != 0)
                    {
                        grantTypes.Add(GrantTypes.ClientCredentials);
                    }
                    return grantTypes;
                }))
                .ForMember(d => d.RedirectUris, opt => opt.MapFrom((IdentityServer4.EntityFramework.Entities.Client s, ClientEditModel d) =>
                {
                    return s.RedirectUris.Select(i => i.Uri);
                }))
                .ForMember(d => d.AllowedScopes, opt => opt.MapFrom((IdentityServer4.EntityFramework.Entities.Client s, ClientEditModel d) =>
                {
                    return s.AllowedScopes.Select(i => i.Scope);
                }));
        }
    }
}

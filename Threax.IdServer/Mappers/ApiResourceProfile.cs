using AutoMapper;
using IdentityServer4.EntityFramework.Entities;
using SpcIdentityServer.Services;
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

            CreateMap<ApiResourceInput, ApiResource>()
                .ForMember(d => d.Id, opt => opt.Ignore())
                .ForMember(d => d.Enabled, opt => opt.ResolveUsing(s => true))
                .ForMember(d => d.Secrets, opt => opt.Ignore())
                .ForMember(d => d.UserClaims, opt => opt.Ignore())
                .ForMember(d => d.Description, opt => opt.Ignore())
                .ForMember(d => d.Name, opt => opt.MapFrom(s => s.ScopeName))
                .ForMember(d => d.Scopes, opt => opt.ResolveUsing((ApiResourceInput s, ApiResource d) =>
                {
                    if (d.Scopes == null || d.Scopes.Count == 0) //No scopes yet, create some
                        {
                        var list = new List<ApiScope>();
                        list.Add(new ApiScope()
                        {
                            Name = s.ScopeName
                        });
                        return list;
                    }
                    else //Already has scopes, update them
                        {
                        d.Scopes[0].Name = s.ScopeName;
                        return d.Scopes;
                    }
                }));

            CreateMap<ApiResource, ApiResourceEditModel>()
                .ForMember(d => d.ScopeName, opt => opt.MapFrom(s => s.Name));

            CreateMap<ClientInput, Client>()
                .ForMember(d => d.Id, opt => opt.Ignore())
                .ForMember(d => d.Enabled, opt => opt.ResolveUsing(s => true))
                .ForMember(d => d.ProtocolType, opt => opt.Ignore())
                .ForMember(d => d.ClientSecrets, opt => opt.Ignore())
                .ForMember(d => d.RequireClientSecret, opt => opt.Ignore())
                .ForMember(d => d.ClientName, opt => opt.MapFrom(s => s.Name))
                .ForMember(d => d.ClientUri, opt => opt.Ignore())
                .ForMember(d => d.LogoUri, opt => opt.Ignore())
                .ForMember(d => d.RequireConsent, opt => opt.ResolveUsing(s => false))
                .ForMember(d => d.AllowRememberConsent, opt => opt.Ignore())
                .ForMember(d => d.AlwaysIncludeUserClaimsInIdToken, opt => opt.Ignore())
                .ForMember(d => d.RequirePkce, opt => opt.Ignore())
                .ForMember(d => d.AllowPlainTextPkce, opt => opt.Ignore())
                .ForMember(d => d.AllowAccessTokensViaBrowser, opt => opt.Ignore())
                .ForMember(d => d.PostLogoutRedirectUris, opt => opt.Ignore())
                .ForMember(d => d.AllowOfflineAccess, opt => opt.ResolveUsing(s => true))
                .ForMember(d => d.IdentityTokenLifetime, opt => opt.Ignore())
                .ForMember(d => d.AuthorizationCodeLifetime, opt => opt.Ignore())
                .ForMember(d => d.AbsoluteRefreshTokenLifetime, opt => opt.Ignore())
                .ForMember(d => d.SlidingRefreshTokenLifetime, opt => opt.Ignore())
                .ForMember(d => d.RefreshTokenUsage, opt => opt.Ignore())
                .ForMember(d => d.UpdateAccessTokenClaimsOnRefresh, opt => opt.Ignore())
                .ForMember(d => d.RefreshTokenExpiration, opt => opt.Ignore())
                .ForMember(d => d.AccessTokenType, opt => opt.Ignore())
                .ForMember(d => d.IdentityProviderRestrictions, opt => opt.Ignore())
                .ForMember(d => d.IncludeJwtId, opt => opt.Ignore())
                .ForMember(d => d.Claims, opt => opt.Ignore())
                .ForMember(d => d.AlwaysSendClientClaims, opt => opt.Ignore())
                .ForMember(d => d.AllowedCorsOrigins, opt => opt.Ignore())
                .ForMember(d => d.AllowedGrantTypes, opt => opt.ResolveUsing((ClientInput s, Client d) =>
                {
                    return s.AllowedGrantTypes.Select(i => new ClientGrantType()
                    {
                        Client = d,
                        GrantType = i
                    });
                }))
                .ForMember(d => d.RedirectUris, opt => opt.ResolveUsing((ClientInput s, Client d) =>
                {
                    return s.RedirectUris.Select(i => new ClientRedirectUri()
                    {
                        Client = d,
                        RedirectUri = i
                    });
                }))
                .ForMember(d => d.AllowedScopes, opt => opt.ResolveUsing((ClientInput s, Client d) =>
                {
                    return s.AllowedScopes.Select(i => new ClientScope()
                    {
                        Client = d,
                        Scope = i
                    });
                }));

            CreateMap<Client, ClientEditModel>()
                .ForMember(d => d.Name, opt => opt.MapFrom(s => s.ClientName))
                .ForMember(d => d.ApplicationGuid, opt => opt.ResolveUsing<ApplicationGuidResolver>())
                .ForMember(d => d.AllowedGrantTypes, opt => opt.ResolveUsing((Client s, ClientEditModel d) =>
                {
                    return s.AllowedGrantTypes.Select(i => i.GrantType);
                }))
                .ForMember(d => d.RedirectUris, opt => opt.ResolveUsing((Client s, ClientEditModel d) =>
                {
                    return s.RedirectUris.Select(i => i.RedirectUri);
                }))
                .ForMember(d => d.AllowedScopes, opt => opt.ResolveUsing((Client s, ClientEditModel d) =>
                {
                    return s.AllowedScopes.Select(i => i.Scope);
                }));
        }
    }
}

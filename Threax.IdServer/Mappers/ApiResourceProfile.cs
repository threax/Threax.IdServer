using System;
using System.Collections.Generic;
using System.Linq;
using Threax.AspNetCore.IdServerMetadata;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Areas.Api.Models;
using Threax.IdServer.EntityFramework.Entities;

namespace Threax.IdServer.Mappers
{
    public partial class AppMapper
    {
        public Client MapClient(ClientInput src, Client dest)
        {
            dest.ClientId = src.ClientId;
            dest.Name = src.Name;
            dest.LogoutUri = src.LogoutUri;
            dest.AllowedGrantTypes = GetGrantTypes(src.AllowedGrantTypes);
            dest.RedirectUris = src.RedirectUris.Select(i => new ClientRedirectUri()
            {
                Uri = i
            }).ToList();
            dest.AllowedScopes = src.AllowedScopes.Select(i => new ClientScope()
            {
                Scope = i
            }).ToList();
            //ClientSecrets is ignored.
            dest.AccessTokenLifetime = src.AccessTokenLifetime;

            return dest;
        }

        public ClientMetadataView MapClient(ClientMetadata src, ClientMetadataView dest)
        {
            dest.ClientId = src.ClientId;
            dest.Name = src.Name;
            dest.LogoutUri = src.LogoutUri;
            dest.AllowedGrantTypes = GetGrantTypes(src.AllowedGrantTypes).ToList();
            dest.RedirectUris = src.RedirectUris;
            dest.AllowedScopes = src.AllowedScopes;
            dest.AccessTokenLifetime = src.AccessTokenLifetime;

            return dest;
        }

        public ClientInput MapClient(ClientMetadata src, ClientInput dest)
        {
            dest.ClientId = src.ClientId;
            dest.Name = src.Name;
            dest.LogoutUri = src.LogoutUri;
            dest.AllowedGrantTypes = GetGrantTypes(src.AllowedGrantTypes).ToList();
            dest.RedirectUris = src.RedirectUris;
            dest.AllowedScopes = src.AllowedScopes;
            dest.AccessTokenLifetime = src.AccessTokenLifetime;

            return dest;
        }

        public ClientEditModel MapClient(Client src, ClientEditModel dest)
        {
            dest.Id = src.Id;
            dest.ClientId = src.ClientId;
            dest.Name = src.Name;
            dest.LogoutUri = src.LogoutUri;
            dest.AllowedGrantTypes = GetGrantTypes(src.AllowedGrantTypes).ToList();
            dest.RedirectUris = src.RedirectUris.Select(i => i.Uri).ToList();
            dest.AllowedScopes = src.AllowedScopes.Select(i => i.Scope).ToList();
            dest.AccessTokenLifetime = src.AccessTokenLifetime;
            dest.ApplicationGuid = guidFactory.CreateGuid(src);

            return dest;
        }

        public GrantTypes GetGrantTypes(IEnumerable<GrantTypes> allowedGrantTypes)
        {
            GrantTypes result = (GrantTypes)0;
            foreach (var type in allowedGrantTypes)
            {
                result |= type;
            }

            return result;
        }

        public IEnumerable<GrantTypes> GetGrantTypes(IEnumerable<String> s)
        {
            if (s == null)
            {
                yield break;
            }

            foreach (var i in s)
            {
                switch (i.ToLowerInvariant())
                {
                    case "client_credentials":
                        yield return GrantTypes.ClientCredentials;
                        break;
                    case "hybrid":
                        yield return GrantTypes.Hybrid;
                        break;
                    case "authorization_code":
                        yield return GrantTypes.AuthorizationCode;
                        break;
                }
            }
        }

        public IEnumerable<GrantTypes> GetGrantTypes(GrantTypes allowedGrantTypes)
        {
            if ((allowedGrantTypes & GrantTypes.AuthorizationCode) != 0)
            {
                yield return GrantTypes.AuthorizationCode;
            }
            if ((allowedGrantTypes & GrantTypes.Hybrid) != 0)
            {
                yield return GrantTypes.Hybrid;
            }
            if ((allowedGrantTypes & GrantTypes.ClientCredentials) != 0)
            {
                yield return GrantTypes.ClientCredentials;
            }
        }

        public ApiResourceMetadataView MapApiResource(ApiResourceMetadata src, ApiResourceMetadataView dest)
        {
            dest.ScopeName = src.ScopeName;
            dest.DisplayName = src.DisplayName;

            return dest;
        }

        public ApiResourceInput MapApiResource(ApiResourceMetadata src, ApiResourceInput dest)
        {
            dest.ScopeName = src.ScopeName;
            dest.DisplayName = src.DisplayName;

            return dest;
        }

        public Scope MapApiResource(ApiResourceInput src, Scope dest)
        {
            //Ignore dest.Id
            dest.Name = src.ScopeName;
            dest.DisplayName = src.DisplayName;

            return dest;
        }

        public ApiResourceEditModel MapApiResource(Scope src, ApiResourceEditModel dest)
        {
            dest.Id = src.Id;
            dest.ScopeName = src.Name;
            dest.DisplayName = src.DisplayName;

            return dest;
        }
    }
}

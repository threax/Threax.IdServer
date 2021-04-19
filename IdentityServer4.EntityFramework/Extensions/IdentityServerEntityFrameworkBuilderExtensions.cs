// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.


using IdentityServer4.EntityFramework.DbContexts;
using IdentityServer4.EntityFramework.Interfaces;
using IdentityServer4.EntityFramework.Stores;
using System;
using IdentityServer4.EntityFramework.Options;
using IdentityServer4.EntityFramework;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using IdentityServer4.EntityFramework.Entities;
using OpenIddict.Abstractions;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Microsoft.Extensions.DependencyInjection
{
    /// <summary>
    /// Extension methods to add EF database support to IdentityServer.
    /// </summary>
    public static class IdentityServerEntityFrameworkBuilderExtensions
    {
        public class Options
        {
            public Action<DbContextOptionsBuilder> SetupConfigurationDbContext { get; set; }

            public Action<DbContextOptionsBuilder> SetupOperationDbContext { get; set; }
        }

        public static OpenIddictCoreBuilder UseThreaxIdServerEf(this OpenIddictCoreBuilder builder, Action<Options> configure)
        {
            var options = new Options();
            configure.Invoke(options);

            if (builder is null)
            {
                throw new ArgumentNullException(nameof(builder));
            }

            // Since Entity Framework Core may be used with databases performing case-insensitive
            // or culture-sensitive comparisons, ensure the additional filtering logic is enforced
            // in case case-sensitive stores were registered before this extension was called.
            builder.Configure(options => options.DisableAdditionalFiltering = false);

            builder.SetDefaultApplicationEntity<Client>()
                   .SetDefaultAuthorizationEntity<Authorization>()
                   .SetDefaultScopeEntity<Scope>()
                   .SetDefaultTokenEntity<Token>();

            builder.Services.TryAddScoped<IOpenIddictApplicationStore<Client>, ApplicationStore>();
            builder.Services.TryAddScoped<IOpenIddictAuthorizationStore<Authorization>, AuthorizationStore>();
            builder.Services.TryAddScoped<IOpenIddictScopeStore<Scope>, ScopeStore>();
            builder.Services.TryAddScoped<IOpenIddictTokenStore<Token>, TokenStore>();

            builder.Services.AddDbContext<ConfigurationDbContext>(o =>
            {
                options.SetupConfigurationDbContext.Invoke(o);
            });

            builder.Services.AddDbContext<OperationDbContext>(o =>
            {
                options.SetupOperationDbContext.Invoke(o);
            });

            return builder;
        }
    }
}

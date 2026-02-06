// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.


using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection.Extensions;
using OpenIddict.Abstractions;
using System;
using Threax.IdServer.EntityFramework.DbContexts;
using Threax.IdServer.EntityFramework.Entities;
using Threax.IdServer.EntityFramework.Managers;
using Threax.IdServer.EntityFramework.Stores;

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

            builder.ReplaceApplicationStore<Client, ApplicationStore>()
                   .ReplaceAuthorizationStore<Authorization, AuthorizationStore>()
                   .ReplaceScopeStore<Scope, ScopeStore>()
                   .ReplaceTokenStore<Token, TokenStore>();

            builder.ReplaceApplicationManager(typeof(ThreaxOpenIddictApplicationManager<>));

            builder.Services.TryAddScoped<ApplicationStore>();
            builder.Services.TryAddScoped<AuthorizationStore>();
            builder.Services.TryAddScoped<ScopeStore>();
            builder.Services.TryAddScoped<TokenStore>();

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

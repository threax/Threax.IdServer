using IdentityServer4.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenIddict.Abstractions;
using OpenIddict.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace IdentityServer4.EntityFramework.Managers
{
    class ThreaxOpenIddictApplicationManager<TApplication> : OpenIddictApplicationManager<TApplication>
         where TApplication : class
    {
        public ThreaxOpenIddictApplicationManager(IOpenIddictApplicationCache<TApplication> cache, ILogger<OpenIddictApplicationManager<TApplication>> logger, IOptionsMonitor<OpenIddictCoreOptions> options, IOpenIddictApplicationStoreResolver resolver) 
            : base(cache, logger, options, resolver)
        {
        }

        protected override ValueTask<bool> ValidateClientSecretAsync(string secret, string comparand, CancellationToken cancellationToken = default)
        {
            var hashed = HashExtensions.Sha256(secret);

            if(hashed.Length != comparand.Length)
            {
                throw new InvalidOperationException("The hashed secret value did not match the length of the hashed databas value.");
            }

            var count = hashed.Length;
            bool constTimeResult = true;
            for(var i = 0; i < count; ++i)
            {
                //Don't bail this early, go through the whole thing each time.
                //Keep order here, want to always compare
                constTimeResult = hashed[i] == comparand[i] && constTimeResult;
            }

            return ValueTask.FromResult(constTimeResult);
        }
    }
}

using IdentityServer4.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenIddict.Abstractions;
using OpenIddict.Core;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Threax.IdServer.EntityFramework.Managers
{
    class ThreaxOpenIddictApplicationManager<TApplication> : OpenIddictApplicationManager<TApplication>
         where TApplication : class
    {
        public ThreaxOpenIddictApplicationManager(IOpenIddictApplicationCache<TApplication> cache, ILogger<OpenIddictApplicationManager<TApplication>> logger, IOptionsMonitor<OpenIddictCoreOptions> options, IOpenIddictApplicationStore<TApplication> store) 
            : base(cache, logger, options, store)
        {
        }

        protected override ValueTask<bool> ValidateClientSecretAsync(string secret, string comparand, CancellationToken cancellationToken = default)
        {
            //Constant time comparisons here are important. Otherwise the secrets can be guessed.
            var hashed = HashExtensions.Sha256(secret);
            var hashedBytes = Encoding.UTF8.GetBytes(hashed);
            var comparendBytes = Encoding.UTF8.GetBytes(comparand);

            var equal = CryptographicOperations.FixedTimeEquals(hashedBytes, comparendBytes);

            return ValueTask.FromResult(equal);
        }
    }
}

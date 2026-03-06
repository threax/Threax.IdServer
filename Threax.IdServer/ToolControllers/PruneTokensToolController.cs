using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using OpenIddict.Abstractions;
using System;
using System.Threading.Tasks;

namespace Threax.IdServer.ToolControllers
{
    public class PruneTokensToolController
    {
        private ILogger<PruneTokensToolController> logger;
        private readonly IOpenIddictAuthorizationManager openIddictAuthorizationManager;
        private readonly IOpenIddictTokenManager openIddictTokenManager;

        public PruneTokensToolController(ILogger<PruneTokensToolController> logger, IOpenIddictAuthorizationManager openIddictAuthorizationManager, IOpenIddictTokenManager openIddictTokenManager)
        {
            this.logger = logger;
            this.openIddictAuthorizationManager = openIddictAuthorizationManager;
            this.openIddictTokenManager = openIddictTokenManager;
        }

        public async Task Run()
        {
            logger.LogCritical($"Pruning tokens");

            var tokenCount = await openIddictTokenManager.PruneAsync(DateTimeOffset.Now.AddDays(-3));
            var authCount = await openIddictAuthorizationManager.PruneAsync(DateTimeOffset.Now.AddDays(-3));

            logger.LogInformation($"Pruned {tokenCount} tokens.");
            logger.LogInformation($"Pruned {authCount} authorizations.");
        }
    }
}

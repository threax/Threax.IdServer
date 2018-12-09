using System;

namespace Threax.IdServer.Services
{
    public interface IApplicationGuidFactory
    {
        /// <summary>
        /// Create a deterministic guid for the client, it will be based off the client id string.
        /// According to the spec this should never collide with guids from other sources and only
        /// have a small chance of colliding with themselves, since these are being used as a user
        /// id where the other sources are either active directory or the external to spc users stored
        /// in the id server database, this should be sufficient.
        /// </summary>
        /// <param name="client">The client to generate a guid for.</param>
        /// <returns>A new deterministic guid for the client.</returns>
        Guid CreateGuid(IdentityServer4.Models.Client client);

        /// <summary>
        /// Create a deterministic guid for the client, it will be based off the client id string.
        /// According to the spec this should never collide with guids from other sources and only
        /// have a small chance of colliding with themselves, since these are being used as a user
        /// id where the other sources are either active directory or the external to spc users stored
        /// in the id server database, this should be sufficient.
        /// </summary>
        /// <param name="client">The client to generate a guid for.</param>
        /// <returns>A new deterministic guid for the client.</returns>
        Guid CreateGuid(IdentityServer4.EntityFramework.Entities.Client client);
    }
}
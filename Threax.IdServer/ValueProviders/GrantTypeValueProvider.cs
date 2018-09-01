using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext.ValueProviders;
using static IdentityModel.OidcConstants;

namespace Threax.IdServer.Areas.Api.ValueProviders
{
    public class GrantTypeValueProvider : LabelValuePairProviderSync
    {
        protected override IEnumerable<ILabelValuePair> GetSourcesSync()
        {
            yield return new LabelValuePair("Hybrid", "hybrid");
            yield return new LabelValuePair("Client Credentials", GrantTypes.ClientCredentials);
            yield return new LabelValuePair("Authorization Code", GrantTypes.AuthorizationCode);
        }
    }
}

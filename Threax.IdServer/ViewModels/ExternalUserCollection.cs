using Halcyon.HAL.Attributes;
using SpcIdentityServer.InputModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.IdServer.Areas.Api.Controllers;

namespace SpcIdentityServer.Models.Api
{
    [HalModel]
    [HalSelfActionLink(typeof(ExternalUsersController), nameof(ExternalUsersController.List))]
    [HalActionLink(typeof(ExternalUsersController), nameof(ExternalUsersController.Get), DocsOnly = true)] //This provides access to docs for showing items
    [HalActionLink(typeof(ExternalUsersController), nameof(ExternalUsersController.List), DocsOnly = true)] //This provides docs for searching the list
    [DeclareHalLink(typeof(ExternalUsersController), nameof(ExternalUsersController.List), PagedCollectionView<Object>.Rels.Next, ResponseOnly = true)]
    [DeclareHalLink(typeof(ExternalUsersController), nameof(ExternalUsersController.List), PagedCollectionView<Object>.Rels.Previous, ResponseOnly = true)]
    [DeclareHalLink(typeof(ExternalUsersController), nameof(ExternalUsersController.List), PagedCollectionView<Object>.Rels.First, ResponseOnly = true)]
    [DeclareHalLink(typeof(ExternalUsersController), nameof(ExternalUsersController.List), PagedCollectionView<Object>.Rels.Last, ResponseOnly = true)]
    public class ExternalUserCollection : PagedCollectionViewWithQuery<ExternalUserView, ExternalUserQuery>
    {
        public ExternalUserCollection(ExternalUserQuery query, int total, IEnumerable<ExternalUserView> items) : base(query, total, items)
        {
        }
    }
}

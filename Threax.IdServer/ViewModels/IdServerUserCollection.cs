using Halcyon.HAL.Attributes;
using Threax.IdServer.InputModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.IdServer.Areas.Api.Controllers;

namespace Threax.IdServer.Models.Api
{
    [HalModel]
    [HalSelfActionLink(typeof(IdServerUsersController), nameof(IdServerUsersController.List))]
    [HalActionLink(typeof(IdServerUsersController), nameof(IdServerUsersController.Get), DocsOnly = true)] //This provides access to docs for showing items
    [HalActionLink(typeof(IdServerUsersController), nameof(IdServerUsersController.List), DocsOnly = true)] //This provides docs for searching the list
    [DeclareHalLink(typeof(IdServerUsersController), nameof(IdServerUsersController.List), PagedCollectionView<Object>.Rels.Next, ResponseOnly = true)]
    [DeclareHalLink(typeof(IdServerUsersController), nameof(IdServerUsersController.List), PagedCollectionView<Object>.Rels.Previous, ResponseOnly = true)]
    [DeclareHalLink(typeof(IdServerUsersController), nameof(IdServerUsersController.List), PagedCollectionView<Object>.Rels.First, ResponseOnly = true)]
    [DeclareHalLink(typeof(IdServerUsersController), nameof(IdServerUsersController.List), PagedCollectionView<Object>.Rels.Last, ResponseOnly = true)]
    public class IdServerUserCollection : PagedCollectionViewWithQuery<IdServerUserView, IdServerUserQuery>
    {
        public IdServerUserCollection(IdServerUserQuery query, int total, IEnumerable<IdServerUserView> items) : base(query, total, items)
        {
        }
    }
}

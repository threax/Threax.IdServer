using Halcyon.HAL.Attributes;
using Threax.IdServer.Areas.Api.Controllers;
using System;
using System.Collections.Generic;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.IdServer.InputModels;

namespace Threax.IdServer.Areas.Api.Models
{
    /// <summary>
    /// View model for collections of clients.
    /// </summary>
    [HalModel]
    [HalSelfActionLink(ApiResourceController.Rels.List, typeof(ApiResourceController))]
    [HalActionLink(CrudRels.List, ApiResourceController.Rels.List, typeof(ApiResourceController))]
    [HalActionLink(CrudRels.Add, ApiResourceController.Rels.Add, typeof(ApiResourceController))]
    [HalActionLink(ApiResourceController.Rels.LoadFromMetadata, typeof(ApiResourceController))]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Next, ApiResourceController.Rels.List, typeof(ApiResourceController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Previous, ApiResourceController.Rels.List, typeof(ApiResourceController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.First, ApiResourceController.Rels.List, typeof(ApiResourceController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Last, ApiResourceController.Rels.List, typeof(ApiResourceController), ResponseOnly = true)]
    public class ApiResourceEditModelCollection : PagedCollectionViewWithQuery<ApiResourceEditModel, ApiResourceQuery>
    {
        public ApiResourceEditModelCollection(ApiResourceQuery query, int total, IEnumerable<ApiResourceEditModel> items)
            :base(query, total, items)
        {
            
        }
    }
}

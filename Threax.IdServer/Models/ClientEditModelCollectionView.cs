using Halcyon.HAL.Attributes;
using Threax.IdServer.Areas.Api.Controllers;
using System;
using System.Collections.Generic;
using Threax.AspNetCore.Halcyon.Ext;

namespace Threax.IdServer.Areas.Api.Models
{
    /// <summary>
    /// View model for collections of clients.
    /// </summary>
    [HalModel]
    [HalSelfActionLink(ClientController.Rels.List, typeof(ClientController))]
    [HalActionLink(CrudRels.List, ClientController.Rels.List, typeof(ClientController))]
    [HalActionLink(CrudRels.Add, ClientController.Rels.Add, typeof(ClientController))]
    [HalActionLink(ClientController.Rels.LoadFromMetadata, typeof(ClientController))]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Next, ClientController.Rels.List, typeof(ClientController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Previous, ClientController.Rels.List, typeof(ClientController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.First, ClientController.Rels.List, typeof(ClientController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Last, ClientController.Rels.List, typeof(ClientController), ResponseOnly = true)]
    public class ClientEditModelCollectionView : PagedCollectionView<ClientEditModel>
    {
        public ClientEditModelCollectionView(PagedCollectionQuery query, int total, IEnumerable<ClientEditModel> items)
            :base(query, total, items)
        {
            
        }
    }
}

using Halcyon.HAL.Attributes;
using TestApi.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;

namespace TestApi.ViewModels
{
    [HalModel]
    [HalSelfActionLink(CrudRels.List, typeof(HorribleBeastsController))]
    [HalActionLink(CrudRels.Get, typeof(HorribleBeastsController), DocsOnly = true)] //This provides access to docs for showing items
    [HalActionLink(CrudRels.List, typeof(HorribleBeastsController), DocsOnly = true)] //This provides docs for searching the list
    [HalActionLink(CrudRels.Add, typeof(HorribleBeastsController))]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Next, CrudRels.List, typeof(HorribleBeastsController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Previous, CrudRels.List, typeof(HorribleBeastsController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.First, CrudRels.List, typeof(HorribleBeastsController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Last, CrudRels.List, typeof(HorribleBeastsController), ResponseOnly = true)]
    public partial class HorribleBeastCollection : PagedCollectionView<HorribleBeast>
    {
        public HorribleBeastCollection(PagedCollectionQuery query, int total, IEnumerable<HorribleBeast> items) : base(query, total, items)
        {
        }
    }
}
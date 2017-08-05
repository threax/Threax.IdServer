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
    [HalSelfActionLink(CrudRels.List, typeof(ValuesController))]
    [HalActionLink(CrudRels.Get, typeof(ValuesController), DocsOnly = true)] //This provides access to docs for showing items
    [HalActionLink(CrudRels.List, typeof(ValuesController), DocsOnly = true)] //This provides docs for searching the list
    [HalActionLink(CrudRels.Add, typeof(ValuesController))]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Next, CrudRels.List, typeof(ValuesController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Previous, CrudRels.List, typeof(ValuesController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.First, CrudRels.List, typeof(ValuesController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Last, CrudRels.List, typeof(ValuesController), ResponseOnly = true)]
    public class ValueCollection : PagedCollectionView<Value>
    {
        public ValueCollection(PagedCollectionQuery query, int total, IEnumerable<Value> items) : base(query, total, items)
        {
        }
    }
}
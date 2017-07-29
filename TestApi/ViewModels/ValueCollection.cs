using Halcyon.HAL.Attributes;
using TestApi.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Crud;
using Threax.AspNetCore.Halcyon.Ext;

namespace TestApi.ViewModels
{
    /// <summary>
    /// This is a collection of ValueViewModels. Any time a collection of objects needs to be returned you should use one of the
    /// CollectionView base classes, such as CollectionView for plain collecitons, PagedCollectionView for collections that have pages
    /// and PagedSearchCollectionView for a paged view with single term search. These classes all have corresponding input models
    /// already defined and usually don't need to do much beyond defining the constructor unless your collection has special data, then
    /// define that in your XViewModelCollection class.
    /// The self links for these collections should point at the list. They will automatically fill in the appropriate query objects
    /// to make the self links work.
    /// Ideally include an add link to any value view collections unless that does not make sense.
    /// Since this collection is paged it also declares the standard page link declarations. Declared links do not get automatically
    /// processsed, but instead must be added when the links are building, which the superclass PagedCollectionView does for us here.
    /// Declaring the links makes the documentation and code generators aware that they exist.
    /// </summary>
    [HalModel]
    [HalSelfActionLink(ValuesController.Rels.List, typeof(ValuesController))]
    [HalActionLink(CrudRels.List, ValuesController.Rels.List, typeof(ValuesController), DocsOnly = true)]
    [HalActionLink(CrudRels.Add, ValuesController.Rels.Add, typeof(ValuesController))]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Next, ValuesController.Rels.List, typeof(ValuesController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Previous, ValuesController.Rels.List, typeof(ValuesController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.First, ValuesController.Rels.List, typeof(ValuesController), ResponseOnly = true)]
    [DeclareHalLink(PagedCollectionView<Object>.Rels.Last, ValuesController.Rels.List, typeof(ValuesController), ResponseOnly = true)]
    public class ValueCollection : PagedCollectionView<Value>
    {
        public ValueCollection(PagedCollectionQuery query, int total, IEnumerable<Value> items) : base(query, total, items)
        {
        }
    }
}

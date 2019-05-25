using System;
using System.Collections.Generic;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Halcyon.Ext.ValueProviders;
using Threax.AspNetCore.Models;
using Threax.IdServer.Areas.Api.ValueProviders;

namespace Threax.IdServer.InputModels
{
    public class ClientQuery : PagedCollectionQuery
    {
        public int? Id { get; set; }

        [UiSearch]
        [UiOrder]
        public String ClientId { get; set; }

        [UiSearch]
        [UiOrder]
        [ValueProvider(typeof(GrantTypeValueProvider))]
        [NullValueLabel("Any")]
        public List<String> GrantTypes { get; set; }

        [UiSearch]
        [UiOrder]
        public bool? HasMissingOrDefaultSecret { get; set; }
    }
}

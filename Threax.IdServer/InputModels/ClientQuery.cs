using System;
using System.Collections.Generic;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Halcyon.Ext.ValueProviders;
using Threax.AspNetCore.Models;
using Threax.IdServer.EntityFramework.Entities;

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
        [NullValueLabel("Any")]
        [CheckboxUiType]
        public List<GrantTypes> GrantTypes { get; set; }

        [UiSearch]
        [UiOrder]
        public bool? HasMissingOrDefaultSecret { get; set; }
    }
}

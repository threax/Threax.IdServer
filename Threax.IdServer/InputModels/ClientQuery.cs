using IdentityServer4.EntityFramework.Entities;
using System;
using System.Collections.Generic;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Halcyon.Ext.ValueProviders;
using Threax.AspNetCore.Models;

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
        public GrantTypes? GrantTypes { get; set; }

        [UiSearch]
        [UiOrder]
        public bool? HasMissingOrDefaultSecret { get; set; }
    }
}

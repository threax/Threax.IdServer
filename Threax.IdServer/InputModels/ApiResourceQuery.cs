using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Models;

namespace Threax.IdServer.InputModels
{
    public class ApiResourceQuery : PagedCollectionQuery
    {
        public int? Id { get; set; }

        [UiSearch]
        [UiOrder]
        public String Name { get; set; }
    }
}

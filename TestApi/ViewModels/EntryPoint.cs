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
    [HalEntryPoint]
    [HalSelfActionLink(EntryPointController.Rels.Get, typeof(EntryPointController))]
    //The value links, remove these if you have removed ValuesController.
    //Typically list and add for any data is exposed here, but you can link to whatever you want.
    [HalActionLink("ListValues", CrudRels.List, typeof(ValuesController))]
    [HalActionLink("AddValue", CrudRels.Add, typeof(ValuesController))]
    //Add HalActionLinks below for any controlers actions you create that should be linked from the entry point.
    public class EntryPoint
    {
    }
}

using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TestApi.ViewModels;
using Threax.AspNetCore.Halcyon.Ext;

namespace TestApi.Controllers
{
    [Route("")]
    [ResponseCache(NoStore = true)]
    public class EntryPointController : Controller
    {
        public class Rels
        {
            public const String Get = "GetEntryPoint";
        }

        [HttpGet]
        [HalRel(Rels.Get)]
        public EntryPoint Get()
        {
            return new EntryPoint();
        }
    }
}

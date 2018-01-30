using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.ClientGen;

namespace Threax.IdServer.Areas.Api.Controllers
{
    [Route("[controller]")]
    [Area("Api")]
    [ResponseCache(NoStore = true)]
    public class ClientGenController : Controller
    {
        [HttpGet]
        public IActionResult Index([FromServices] IClientGenerator clientGenerator)
        {
            return new JsonResult(clientGenerator.GetEndpointDefinitions());
        }

        [HttpGet("[action]")]
        public IActionResult Typescript([FromServices] TypescriptClientWriter clientWriter)
        {
            using (var writer = new StringWriter())
            {
                clientWriter.CreateClient(writer);
                return Content(writer.ToString());
            }
        }
    }
}

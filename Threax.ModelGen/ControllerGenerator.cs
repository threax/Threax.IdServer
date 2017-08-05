using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.ModelGen
{
    static class ControllerGenerator
    {
        public static String Get(String ns, String modelName)
        {
            var modelSuffix = modelName.Length > 0 ? modelName.Substring(1) : "";
            var Model = modelName[0].ToString().ToUpperInvariant() + modelSuffix;
            var model = modelName[0].ToString().ToLowerInvariant() + modelSuffix;
            return Create(ns, Model, model);
        }

        private static String Create(String ns, String Model, String model)
        {
            return
$@"using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using {ns}.Repository;
using Threax.AspNetCore.Halcyon.Ext;
using {ns}.ViewModels;
using {ns}.InputModels;

namespace {ns}.Controllers
{{
    [Route(""[controller]"")]
    [ResponseCache(NoStore = true)]
    public class {Model}sController : Controller
    {{
        private I{Model}Repository repo;

        public {Model}sController(I{Model}Repository repo)
        {{
            this.repo = repo;
        }}

        [HttpGet]
        [HalRel(CrudRels.List)]
        public async Task<{Model}Collection> List([FromQuery] PagedCollectionQuery query)
        {{
            return await repo.List(query);
        }}

        [HttpGet(""{{{Model}Id}}"")]
        [HalRel(CrudRels.Get)]
        public async Task<{Model}> Get(Guid {model}Id)
        {{
            return await repo.Get({model}Id);
        }}

        [HttpPost]
        [HalRel(CrudRels.Add)]
        [AutoValidate(""Cannot add new {model}"")]
        public async Task<{Model}> Add([FromBody]{Model}Input {model})
        {{
            return await repo.Add({model});
        }}

        [HttpPut(""{{{Model}Id}}"")]
        [HalRel(CrudRels.Update)]
        [AutoValidate(""Cannot update {model}"")]
        public async Task<{Model}> Update(Guid {model}Id, [FromBody]{Model}Input {model})
        {{
            return await repo.Update({model}Id, {model});
        }}

        [HttpDelete(""{{{Model}Id}}"")]
        [HalRel(CrudRels.Delete)]
        public async Task Delete(Guid {model}Id)
        {{
            await repo.Delete({model}Id);
        }}
    }}
}}";
        }
    }
}

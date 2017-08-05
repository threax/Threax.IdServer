using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.ModelGen
{
    static class RepoInterfaceGenerator
    {
        public static String Get(String ns, String modelName)
        {
            var modelSuffix = modelName.Length > 0 ? modelName.Substring(1) : "";
            var Model = modelName[0].ToString().ToUpperInvariant() + modelSuffix;
            var model = modelName[0].ToString().ToLowerInvariant() + modelSuffix;
            return Create(ns, Model, model);
        }

        private static String Create(String ns, String Model, String model) {
            return
$@"using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using {ns}.InputModels;
using {ns}.ViewModels;
using Threax.AspNetCore.Halcyon.Ext;

namespace {ns}.Repository
{{
    public interface I{Model}Repository
    {{
        Task<{Model}> Add({Model}Input value);
        Task AddRange(IEnumerable<{Model}Input> values);
        Task Delete(Guid id);
        Task<{Model}> Get(Guid {model}Id);
        Task<bool> Has{Model}s();
        Task<{Model}Collection> List(PagedCollectionQuery query);
        Task<{Model}> Update(Guid {model}Id, {Model}Input value);
    }}
}}";
        }
    }
}

using System;
using System.Collections.Generic;
using System.Text;

using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.ModelGen
{
    public class IdInterfaceWriter : InterfaceWriter
    {
        public override String StartType(String name)
        {
            return $@"    public interface I{name}Id
    {{
        Guid {name}Id {{ get; set; }}
    }}

{base.StartType(name)}";
        }
    }
}


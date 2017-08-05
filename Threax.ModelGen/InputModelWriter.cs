using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.ModelGen
{
    class InputModelWriter : ClassWriter
    {
        public override String StartType(String name)
        {
            return $@"    public class {name}Input : I{name}
    {{";
        }
    }
}

using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.ModelGen
{
    public class InterfaceWriter : ClassWriter
    {
        public override String StartType(String name)
        {
            return $@"    public interface I{name} 
    {{";
        }

        public override String CreateProperty(String type, String name)
        {
            return $"        {type} {name} {{ get; set; }}";
        }
    }
}

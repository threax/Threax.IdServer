using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.ModelGen
{
    class InputModelWriter : ClassWriter
    {
        public override string AddUsings(string ns)
        {
            return $@"{base.AddUsings(ns)}
using Halcyon.HAL.Attributes;
using Newtonsoft.Json;
using {ns}.Models;";
        }

        public override String StartType(String name)
        {
            return $@"    public class {name}Input : I{name}
    {{";
        }
    }
}

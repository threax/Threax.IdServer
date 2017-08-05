using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.ModelGen
{
    class EntityWriter : ClassWriter
    {
        public override string AddUsings(string ns)
        {
            return $@"{base.AddUsings(ns)}
using {ns}.Models;";
        }

        public override String StartType(String name)
        {
            return $@"    public class {name}Entity : I{name}, I{name}Id{AdditionalInterfacesText}
    {{
{CreateProperty("Guid", $"{name}Id")}";
        }

        public String AdditionalInterfaces { get; set; }

        private String AdditionalInterfacesText
        {
            get
            {
                if (String.IsNullOrWhiteSpace(AdditionalInterfaces))
                {
                    return "";
                }
                else
                {
                    return ", " + AdditionalInterfaces;
                }
            }
        }
    }
}

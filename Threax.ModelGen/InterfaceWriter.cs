﻿using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.ModelGen
{
    public class InterfaceWriter : ITypeWriter
    {
        public String StartType(String name)
        {
            return $@"    public interface I{name} 
    {{";
        }

        public String EndType()
        {
            return "    }";
        }

        public String AddMaxLength(int length, String errorMessage)
        {
            return $@"        [MaxLength({length}, ErrorMessage = ""{errorMessage}"")]";
        }

        public String AddRequired(String errorMessage)
        {
            return $@"        [Required(ErrorMessage = ""{errorMessage}"")]";
        }

        public String AddTypeDisplay(String name)
        {
            return $@"    [Display(Name = ""{name}"")]";
        }

        public String AddDisplay(String name)
        {
            return $@"        [Display(Name = ""{name}"")]";
        }

        public String CreateProperty(String type, String name)
        {
            return $"        {type} {name} {{ get; set; }}";
        }

        public string EndNamespace()
        {
            return "}";
        }

        public string StartNamespace(string name)
        {
            return $@"namespace {name} 
{{";
        }
    }
}

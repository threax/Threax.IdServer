﻿using System;

namespace Threax.ModelGen
{
    public interface ITypeWriter
    {
        string AddUsings(String ns);
        string AddDisplay(string name);
        string AddMaxLength(int length, string errorMessage);
        string AddRequired(string errorMessage);
        string CreateProperty(string type, string name);
        string EndType(String name);
        string StartType(string name);
        String AddTypeDisplay(String name);
        string EndNamespace();
        string StartNamespace(string name);
    }
}
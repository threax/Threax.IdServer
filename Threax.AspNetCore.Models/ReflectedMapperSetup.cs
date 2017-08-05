using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;

namespace Threax.AspNetCore.Models
{
    /// <summary>
    /// This class sets up mappings for all classes that implement IAutomapperSetup.
    /// </summary>
    public static class ReflectedMapperSetup
    {
        public static void SetupReflectedMappings(this IMapperConfigurationExpression cfg, Assembly assembly)
        {
            var setupType = typeof(IAutomapperSetup);
            var types = assembly.GetTypes().Where(i =>
            {
                var typeInfo = i.GetTypeInfo();
                return setupType.IsAssignableFrom(i) && !typeInfo.IsAbstract && !typeInfo.IsInterface;
            });
            foreach(var type in types)
            {
                var instance = (IAutomapperSetup)Activator.CreateInstance(type);
                instance.Configure(cfg);
            }
        }
    }
}

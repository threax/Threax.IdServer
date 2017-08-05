using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.ModelGen
{
    static class RepoConfigGenerator
    {
        public static String Get(String ns, String modelName)
        {
            String Model, model;
            NameGenerator.CreatePascalAndCamel(modelName, out Model, out model);
            return Create(ns, Model);
        }

        private static String Create(String ns, String Model)
        {
            return
$@"using System;
using System.Collections.Generic;
using System.Text;
using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Threax.AspNetCore.Models;
using Microsoft.Extensions.DependencyInjection.Extensions;
using {ns}.Repository;

namespace {ns}.Mappers
{{
    partial class {Model}RepoConfig : IServiceSetup
    {{
        public void ConfigureServices(IServiceCollection services)
        {{
            OnConfigureServices(services);

            services.TryAddScoped<I{Model}ModelRepository, {Model}ModelRepository>();
        }}

        partial void OnConfigureServices(IServiceCollection services);
    }}
}}";
        }
    }
}

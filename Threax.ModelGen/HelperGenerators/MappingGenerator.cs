using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.ModelGen
{
    static class MappingGenerator
    {
        public static String Get(String ns, String modelName)
        {
            String Model = NameGenerator.CreatePascal(modelName);
            return Create(ns, Model);
        }

        private static String Create(String ns, String Model)
        {
            return
$@"using System;
using System.Collections.Generic;
using System.Text;
using AutoMapper;
using Threax.AspNetCore.Models;
using {ns}.InputModels;
using {ns}.Database;
using {ns}.ViewModels;

namespace {ns}.Mappers
{{
    public partial class {Model}Mapper : IAutomapperSetup
    {{
        public void Configure(IMapperConfigurationExpression cfg)
        {{
            //Map the input model to the entity
            var inputToEntity = cfg.CreateMap<{Model}Input, {Model}Entity>()
                .ForMember(d => d.{Model}Id, opt => opt.Ignore());

            OnInputToEntity(inputToEntity);

            //Map the entity to the view model.
            var entityToView = cfg.CreateMap<{Model}Entity, {Model}>();

            OnEntityToView(entityToView);
        }}

        partial void OnInputToEntity(IMappingExpression<{Model}Input, {Model}Entity> expr);

        partial void OnEntityToView(IMappingExpression<{Model}Entity, {Model}> expr);
    }}
}}";
        }
    }
}

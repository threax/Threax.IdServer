using System;
using System.Collections.Generic;
using System.Text;
using AutoMapper;
using Threax.AspNetCore.Models;
using TestApi.InputModels;
using TestApi.Database;
using TestApi.ViewModels;

namespace TestApi.Mappers
{
    public partial class ValueMapper : IAutomapperSetup
    {
        public void Configure(IMapperConfigurationExpression cfg)
        {
            //Map the input model to the entity
            var inputToEntity = cfg.CreateMap<ValueInput, ValueEntity>()
                .ForMember(d => d.ValueId, opt => opt.Ignore());

            OnInputToEntity(inputToEntity);

            //Map the entity to the view model.
            var entityToView = cfg.CreateMap<ValueEntity, Value>();

            OnEntityToView(entityToView);
        }

        partial void OnInputToEntity(IMappingExpression<ValueInput, ValueEntity> expr);

        partial void OnEntityToView(IMappingExpression<ValueEntity, Value> expr);
    }
}
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
    public partial class HorribleBeastMapper : IAutomapperSetup
    {
        public void Configure(IMapperConfigurationExpression cfg)
        {
            //Map the input model to the entity
            var inputToEntity = cfg.CreateMap<HorribleBeastInput, HorribleBeastEntity>()
                .ForMember(d => d.HorribleBeastId, opt => opt.Ignore());

            OnInputToEntity(inputToEntity);

            //Map the entity to the view model.
            var entityToView = cfg.CreateMap<HorribleBeastEntity, HorribleBeast>();

            OnEntityToView(entityToView);
        }

        partial void OnInputToEntity(IMappingExpression<HorribleBeastInput, HorribleBeastEntity> expr);

        partial void OnEntityToView(IMappingExpression<HorribleBeastEntity, HorribleBeast> expr);
    }
}
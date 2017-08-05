//using System;
//using System.Collections.Generic;
//using System.Text;
//using AutoMapper;
//using Threax.AspNetCore.Models;
//using CoolNamespace.InputModels;
//using CoolNamespace.Database;
//using CoolNamespace.ViewModels;

//namespace CoolNamespace.Mappers
//{
//    partial class TheBestModelMapper : IAutomapperSetup
//    {
//        public void Configure(IMapperConfigurationExpression cfg)
//        {
//            //Map the input model to the entity
//            var inputToEntity = cfg.CreateMap<TheBestModelInput, TheBestModelEntity>()
//                .ForMember(d => d.TheBestModelId, opt => opt.Ignore());

//            OnInputToEntity(inputToEntity);

//            //Map the entity to the view model.
//            var entityToView = cfg.CreateMap<TheBestModelEntity, TheBestModel>();

//            OnEntityToView(entityToView);
//        }

//        partial void OnInputToEntity(IMappingExpression<TheBestModelInput, TheBestModelEntity> expr);

//        partial void OnEntityToView(IMappingExpression<TheBestModelEntity, TheBestModel> expr);
//    }
//}

//interface TheBestModelInput { }
//interface TheBestModelEntity { int TheBestModelId { get; set; } }
//interface TheBestModel { }
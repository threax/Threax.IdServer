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
    public partial class ValueMapper : Profile
    {
        public ValueMapper()
        {
            //Map the input model to the entity
            CreateMap<ValueInput, ValueEntity>()
                .ForMember(d => d.ValueId, opt => opt.Ignore());

            //Map the entity to the view model.
            CreateMap<ValueEntity, Value>();
        }
    }
}
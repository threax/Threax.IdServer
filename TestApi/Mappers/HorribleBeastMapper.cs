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
    public partial class HorribleBeastMapper : Profile
    {
        public HorribleBeastMapper()
        {
            //Map the input model to the entity
            CreateMap<HorribleBeastInput, HorribleBeastEntity>()
                .ForMember(d => d.HorribleBeastId, opt => opt.Ignore());

            //Map the entity to the view model.
            CreateMap<HorribleBeastEntity, HorribleBeast>();
        }
    }
}
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Text;

namespace Threax.AspNetCore.Models
{
    public interface IAutomapperSetup
    {
        void Configure(IMapperConfigurationExpression cfg);
    }
}

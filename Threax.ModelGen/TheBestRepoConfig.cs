using System;
using System.Collections.Generic;
using System.Text;
using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Threax.AspNetCore.Models;
using Microsoft.Extensions.DependencyInjection.Extensions;
//using CoolNamespace.Repository;

namespace CoolNamespace.Mappers
{
    partial class TheBestRepoConfig : IServiceSetup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            OnConfigureServices(services);

            services.TryAddScoped<ITheBestModelRepository, TheBestModelRepository>();
        }

        partial void OnConfigureServices(IServiceCollection services);
    }
}

interface ITheBestModelRepository { }
class TheBestModelRepository: ITheBestModelRepository { }
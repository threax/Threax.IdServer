using System;
using System.Collections.Generic;
using System.Text;
using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Threax.AspNetCore.Models;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TestApi.Repository;

namespace TestApi.Mappers
{
    public partial class HorribleBeastRepoConfig : IServiceSetup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            OnConfigureServices(services);

            services.TryAddScoped<IHorribleBeastRepository, HorribleBeastRepository>();
        }

        partial void OnConfigureServices(IServiceCollection services);
    }
}
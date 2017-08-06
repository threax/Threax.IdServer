using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Halcyon.HAL.Attributes;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Halcyon.Ext.UIAttrs;
namespace TestApi.Models 
{
    public interface IHorribleBeast 
    {

        String Name { get; set; }


        int NumLegs { get; set; }


        int NumEyes { get; set; }

    }

    public interface IHorribleBeastId
    {
        Guid HorribleBeastId { get; set; }
    }
}
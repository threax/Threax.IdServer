using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Halcyon.HAL.Attributes;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Halcyon.Ext.UIAttrs;
using TestApi.Models;
namespace TestApi.InputModels 
{
    [UiTitle("HorribleBeast")]
    [HalModel]
    public class HorribleBeastInput : IHorribleBeast
    {

        [Required(ErrorMessage = "HorribleBeast must have a value.")]
        public String Name { get; set; }


        public int NumLegs { get; set; }


        public int NumEyes { get; set; }
    }
}
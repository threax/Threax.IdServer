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
    [UiTitle("Value")]
    [HalModel]
    public class ValueInput : IValue
    {

        [Required(ErrorMessage = "Value must have a value.")]
        public String Name { get; set; }
    }
}
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Halcyon.HAL.Attributes;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Halcyon.Ext.UIAttrs;
using TestApi.Models;
namespace TestApi.Database 
{
    public class ValueEntity : IValue, IValueId
    {
        [Key]
        public Guid ValueId { get; set; }

        public String Name { get; set; }
    }
}
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Halcyon.HAL.Attributes;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Halcyon.Ext.UIAttrs;
using TestApi.Models;
using TestApi.Controllers;
namespace TestApi.ViewModels 
{
    [UiTitle("Value")]
    [HalModel]
    [HalSelfActionLink(CrudRels.Get, typeof(ValuesController))]
    [HalActionLink(CrudRels.Update, typeof(ValuesController))]
    [HalActionLink(CrudRels.Delete, typeof(ValuesController))]
    public class Value : IValue, IValueId
    {
        public Guid ValueId { get; set; }

        public String Name { get; set; }
    }
}
using Halcyon.HAL.Attributes;
using Newtonsoft.Json;
using TestApi.Controllers;
using TestApi.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;

namespace TestApi.ViewModels
{
    /// <summary>
    /// A needed model type. Defines the json object for the data and the link definitions. You can recycle these as input models,
    /// but you are likely to find having them separate is better.
    /// The HalSelfActionLink and HalActionLinks define the links that this model exposes. Most models should have a self link
    /// that point to themselves.
    /// </summary>
    [HalModel]
    [HalSelfActionLink(CrudRels.Get, typeof(ValuesController))]
    [HalActionLink(CrudRels.Update, typeof(ValuesController))]
    [HalActionLink(CrudRels.Delete, typeof(ValuesController))]
    public class Value : IValue, IValueId
    {
        /// <summary>
        /// The name property.
        /// </summary>
        [Display(Name = "Renamed Name")]
        public String Name { get; set; }

        /// <summary>
        /// An id property, view models should include these.
        /// Note that any urls that may contain the ValueId should be written with that
        /// case, right now those links are case sensitive in the routes for they hypermedia
        /// library even though mvc does not require the same case, this needs to be fixed
        /// in the future.
        /// </summary>
        [Display(Name = "Value Id")]
        [JsonProperty]
        public Guid ValueId { get; set; }
    }
}

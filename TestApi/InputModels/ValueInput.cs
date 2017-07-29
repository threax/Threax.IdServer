using Halcyon.HAL.Attributes;
using Newtonsoft.Json;
using TestApi.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace TestApi.InputModels
{
    /// <summary>
    /// This type of model is optional, but reccomended. This provides a different view of your models specific to input. These
    /// typically will contain raw ids instead of complete information like ViewModels might.
    /// </summary>
    [HalModel]
    public class ValueInput : IValue
    {
        [Display(Name = "Name")]
        [Required(ErrorMessage = "You must include a name.")]
        public String Name { get; set; }
    }
}

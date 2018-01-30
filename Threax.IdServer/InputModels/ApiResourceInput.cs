using Halcyon.HAL.Attributes;
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Threax.IdServer.Areas.Api.InputModels
{
    [HalModel]
    public class ApiResourceInput// : IApiResourceMetadata
    {
        [DisplayName("Scope Name")]
        [Required]
        public String ScopeName { get; set; }

        [DisplayName("Display Name")]
        [Required]
        public String DisplayName { get; set; }
    }
}

using Halcyon.HAL.Attributes;
using Threax.IdServer.Areas.Api.Controllers;
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Threax.AspNetCore.Halcyon.Ext;

namespace Threax.IdServer.Areas.Api.Models
{
    [HalModel]
    [HalSelfActionLink(ApiResourceController.Rels.LoadFromMetadata, typeof(ApiResourceController))]
    public class ApiResourceMetadataView// : IApiResourceMetadata
    {
        [DisplayName("Scope Name")]
        [Required]
        public String ScopeName { get; set; }

        [DisplayName("Display Name")]
        [Required]
        public String DisplayName { get; set; }
    }
}

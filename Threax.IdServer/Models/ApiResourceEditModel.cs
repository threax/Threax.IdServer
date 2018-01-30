using Halcyon.HAL.Attributes;
using Threax.IdServer.Areas.Api.Controllers;
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Threax.AspNetCore.Halcyon.Ext;

namespace Threax.IdServer.Areas.Api.Models
{
    [HalModel]
    [HalSelfActionLink(ApiResourceController.Rels.Get, typeof(ApiResourceController))]
    [HalActionLink(ApiResourceController.Rels.Get, typeof(ApiResourceController))]
    [HalActionLink(CrudRels.Update, ApiResourceController.Rels.Update, typeof(ApiResourceController))]
    [HalActionLink(CrudRels.Delete, ApiResourceController.Rels.Delete, typeof(ApiResourceController))]
    public class ApiResourceEditModel// : IApiResourceMetadata
    {
        [DisplayName("Id")]
        [ReadOnly(true)]
        public int Id { get; set; }

        [DisplayName("Scope Name")]
        [Required]
        public String ScopeName { get; set; }

        [DisplayName("Display Name")]
        [Required]
        public String DisplayName { get; set; }
    }
}

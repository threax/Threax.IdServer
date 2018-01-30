using Halcyon.HAL.Attributes;
using Threax.IdServer.Areas.Api.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;

namespace Threax.IdServer.Areas.Api.Models
{
    [HalModel]
    [HalSelfActionLink(ClientController.Rels.Secret, typeof(ClientController))]
    public class CreateSecretResult
    {
        public String Secret { get; set; }
    }
}

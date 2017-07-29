using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;

namespace TestApi.Controllers
{
    [Route("[controller]")]
    [ResponseCache(NoStore = true)]
    public class EndpointDocController : Controller
    {
        IEndpointDocBuilder descriptionProvider;

        public EndpointDocController(IEndpointDocBuilder descriptionProvider)
        {
            this.descriptionProvider = descriptionProvider;
        }

        [HttpGet("{groupName}/{method}/{*relativePath}")]
        [HalRel(HalDocEndpointInfo.DefaultRels.Get)]
        public EndpointDoc Get(String groupName, String method, String relativePath)
        {
            return descriptionProvider.GetDoc(groupName, method, relativePath);
        }
    }
}

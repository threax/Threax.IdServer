using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using Threax.AspNetCore.Halcyon.Ext;

namespace Threax.IdServer.Areas.Api.Controllers
{
    [Area("Api")]
    [Route("[controller]")]
    [ResponseCache(NoStore = true)]
    [Authorize(AuthenticationSchemes = AuthCoreSchemes.Bearer)]
    public class EndpointDocController : Controller
    {
        IEndpointDocBuilder descriptionProvider;

        public EndpointDocController(IEndpointDocBuilder descriptionProvider)
        {
            this.descriptionProvider = descriptionProvider;
        }

        [HttpGet("{groupName}/{method}/{*relativePath}")]
        [HalRel(HalDocEndpointInfo.DefaultRels.Get)]
        [AllowAnonymous]
        public EndpointDoc Get(String groupName, String method, String relativePath)
        {
            return descriptionProvider.GetDoc(groupName, method, relativePath);
        }
    }
}

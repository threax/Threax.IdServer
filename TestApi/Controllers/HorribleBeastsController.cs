using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TestApi.Repository;
using Threax.AspNetCore.Halcyon.Ext;
using TestApi.ViewModels;
using TestApi.InputModels;

namespace TestApi.Controllers
{
    [Route("[controller]")]
    [ResponseCache(NoStore = true)]
    public partial class HorribleBeastsController : Controller
    {
        private IHorribleBeastRepository repo;

        public HorribleBeastsController(IHorribleBeastRepository repo)
        {
            this.repo = repo;
        }

        [HttpGet]
        [HalRel(CrudRels.List)]
        public async Task<HorribleBeastCollection> List([FromQuery] PagedCollectionQuery query)
        {
            Task task = null;
            OnList(query, ref task);
            if(task != null)
            {
                await task;
            }
            return await repo.List(query);
        }

        partial void OnList(PagedCollectionQuery query, ref Task task);

        [HttpGet("{HorribleBeastId}")]
        [HalRel(CrudRels.Get)]
        public async Task<HorribleBeast> Get(Guid horribleBeastId)
        {
            Task task = null;
            OnGet(horribleBeastId, ref task);
            if (task != null)
            {
                await task;
            }
            return await repo.Get(horribleBeastId);
        }

        partial void OnGet(Guid horribleBeastId, ref Task task);

        [HttpPost]
        [HalRel(CrudRels.Add)]
        [AutoValidate("Cannot add new horribleBeast")]
        public async Task<HorribleBeast> Add([FromBody]HorribleBeastInput horribleBeast)
        {
            Task task = null;
            OnAdd(horribleBeast, ref task);
            if (task != null)
            {
                await task;
            }
            return await repo.Add(horribleBeast);
        }

        partial void OnAdd(HorribleBeastInput horribleBeast, ref Task task);

        [HttpPut("{HorribleBeastId}")]
        [HalRel(CrudRels.Update)]
        [AutoValidate("Cannot update horribleBeast")]
        public async Task<HorribleBeast> Update(Guid horribleBeastId, [FromBody]HorribleBeastInput horribleBeast)
        {
            Task task = null;
            OnUpdate(horribleBeast, ref task);
            if (task != null)
            {
                await task;
            }
            return await repo.Update(horribleBeastId, horribleBeast);
        }

        partial void OnUpdate(HorribleBeastInput horribleBeast, ref Task task);

        [HttpDelete("{HorribleBeastId}")]
        [HalRel(CrudRels.Delete)]
        public async Task Delete(Guid horribleBeastId)
        {
            Task task = null;
            OnDelete(horribleBeastId, ref task);
            if (task != null)
            {
                await task;
            }
            await repo.Delete(horribleBeastId);
        }

        partial void OnDelete(Guid horribleBeastId, ref Task task);
    }
}
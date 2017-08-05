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
    public partial class ValuesController : Controller
    {
        private IValueRepository repo;

        public ValuesController(IValueRepository repo)
        {
            this.repo = repo;
        }

        [HttpGet]
        [HalRel(CrudRels.List)]
        public async Task<ValueCollection> List([FromQuery] PagedCollectionQuery query)
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

        [HttpGet("{ValueId}")]
        [HalRel(CrudRels.Get)]
        public async Task<Value> Get(Guid valueId)
        {
            Task task = null;
            OnGet(valueId, ref task);
            if (task != null)
            {
                await task;
            }
            return await repo.Get(valueId);
        }

        partial void OnGet(Guid valueId, ref Task task);

        [HttpPost]
        [HalRel(CrudRels.Add)]
        [AutoValidate("Cannot add new value")]
        public async Task<Value> Add([FromBody]ValueInput value)
        {
            Task task = null;
            OnAdd(value, ref task);
            if (task != null)
            {
                await task;
            }
            return await repo.Add(value);
        }

        partial void OnAdd(ValueInput value, ref Task task);

        [HttpPut("{ValueId}")]
        [HalRel(CrudRels.Update)]
        [AutoValidate("Cannot update value")]
        public async Task<Value> Update(Guid valueId, [FromBody]ValueInput value)
        {
            Task task = null;
            OnUpdate(value, ref task);
            if (task != null)
            {
                await task;
            }
            return await repo.Update(valueId, value);
        }

        partial void OnUpdate(ValueInput value, ref Task task);

        [HttpDelete("{ValueId}")]
        [HalRel(CrudRels.Delete)]
        public async Task Delete(Guid valueId)
        {
            Task task = null;
            OnDelete(valueId, ref task);
            if (task != null)
            {
                await task;
            }
            await repo.Delete(valueId);
        }

        partial void OnDelete(Guid valueId, ref Task task);
    }
}
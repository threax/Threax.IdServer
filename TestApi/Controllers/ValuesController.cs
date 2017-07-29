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
    /// <summary>
    /// Controllers should return plain view model objects, they will be converted to link objects later.
    /// For most service controllers we don't want to cache the data.
    /// </summary>
    [Route("[controller]")]
    [ResponseCache(NoStore = true)]
    public class ValuesController : Controller
    {
        /// <summary>
        /// Each controller should define a Rels class inside of it. Note that each rel across the system
        /// should be unique, so name them with an appropriate prefix. Right now these rel names are used
        /// by the codegen to make functions, which is why they need to be unique (technically only unique
        /// across any endpoints that have the same rels, but globally is a good enough approximiation of this,
        /// I hope to fix this in the future.
        /// </summary>
        public static class Rels
        {
            public const String List = "ListValues";
            public const String Get = "GetValue";
            public const String Add = "AddValue";
            public const String Update = "UpdateValue";
            public const String Delete = "DeleteValue";
        }

        private IValueRepository repo;

        public ValuesController(IValueRepository repo)
        {
            this.repo = repo;
        }

        /// <summary>
        /// A list function. This one takes the generic page query to make the listing paged.
        /// This is a bit contrived since there is no db in this example, but its designed to be easily
        /// removed.
        /// </summary>
        /// <param name="query">The paged collection query to get the values.</param>
        /// <returns></returns>
        [HttpGet]
        [HalRel(Rels.List)]
        public Task<ValueCollection> Get([FromQuery] PagedCollectionQuery query)
        {
            //If you do more than just query the repo add async to the function signature and await the following call
            return repo.List(query);
        }

        /// <summary>
        /// Get a single value.
        /// </summary>
        /// <param name="valueId">The id of the value to lookup.</param>
        /// <returns></returns>
        [HttpGet("{ValueId}")] //Note that ValueId here and elsewhere needs to be written the same way it is in ValueViewModel, this is true for all models / routes
        [HalRel(Rels.Get)]
        public Task<Value> Get(Guid valueId)
        {
            //If you do more than just query the repo add async to the function signature and await the following call
            return repo.Get(valueId);
        }

        /// <summary>
        /// Add a value.
        /// </summary>
        /// <param name="value">The value to add.</param>
        [HttpPost]
        [HalRel(Rels.Add)]
        [AutoValidate("Cannot add new value")]
        public Task<Value> Post([FromBody]ValueInput value)
        {
            //If you do more than just query the repo add async to the function signature and await the following call
            return repo.Add(value);
        }

        /// <summary>
        /// Update a value.
        /// </summary>
        /// <param name="valueId">The id of the value to update.</param>
        /// <param name="value"></param>
        [HttpPut("{ValueId}")]
        [HalRel(Rels.Update)]
        [AutoValidate("Cannot update value")]
        public Task<Value> Put(Guid valueId, [FromBody]ValueInput value)
        {
            //If you do more than just query the repo add async to the function signature and await the following call
            return repo.Update(valueId, value);
        }

        /// <summary>
        /// Delete a value.
        /// </summary>
        /// <param name="valueId"></param>
        [HttpDelete("{ValueId}")]
        [HalRel(Rels.Delete)]
        public Task Delete(Guid valueId)
        {
            //If you do more than just query the repo add async to the function signature and await the following call
            return repo.Delete(valueId);
        }
    }
}

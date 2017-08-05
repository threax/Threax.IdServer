using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TestApi.InputModels;
using TestApi.ViewModels;
using Threax.AspNetCore.Halcyon.Ext;

namespace TestApi.Repository
{
    public interface IValueRepository
    {
        Task<Value> Add(ValueInput value);
        Task AddRange(IEnumerable<ValueInput> values);
        Task Delete(Guid id);
        Task<Value> Get(Guid valueId);
        Task<bool> HasValues();
        Task<ValueCollection> List(PagedCollectionQuery query);
        Task<Value> Update(Guid valueId, ValueInput value);
    }
}
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TestApi.InputModels;
using TestApi.ViewModels;
using Threax.AspNetCore.Halcyon.Ext;

namespace TestApi.Repository
{
    public partial interface IHorribleBeastRepository
    {
        Task<HorribleBeast> Add(HorribleBeastInput value);
        Task AddRange(IEnumerable<HorribleBeastInput> values);
        Task Delete(Guid id);
        Task<HorribleBeast> Get(Guid horribleBeastId);
        Task<bool> HasHorribleBeasts();
        Task<HorribleBeastCollection> List(PagedCollectionQuery query);
        Task<HorribleBeast> Update(Guid horribleBeastId, HorribleBeastInput value);
    }
}
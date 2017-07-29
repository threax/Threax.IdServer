using System;
using System.Threading.Tasks;
using TestApi.InputModels;
using TestApi.ViewModels;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.AspNetCore.Crud;

namespace TestApi.Repository
{
    /// <summary>
    /// The IValueRepository just inherits all the functions from the ICrudRepo, but if you had more you can define them here.
    /// </summary>
    public interface IValueRepository : ICrudRepo<Guid, PagedCollectionQuery, ValueInput, Value, ValueCollection>
    {
        
    }
}
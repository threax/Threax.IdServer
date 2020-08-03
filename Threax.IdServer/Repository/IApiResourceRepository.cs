using System.Threading.Tasks;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Areas.Api.Models;
using Threax.IdServer.InputModels;

namespace Threax.IdServer.Repository
{
    public interface IApiResourceRepository
    {
        Task Add(ApiResourceInput value);
        Task AddOrUpdate(ApiResourceInput value);
        Task Delete(int id);
        Task<ApiResourceEditModel> Get(int id);
        Task<ApiResourceEditModelCollection> Query(ApiResourceQuery query);
        Task Update(int id, ApiResourceInput value);
    }
}
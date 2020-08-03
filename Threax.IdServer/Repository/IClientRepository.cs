using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Areas.Api.Models;
using Threax.IdServer.InputModels;

namespace Threax.IdServer.Repository
{
    public interface IClientRepository
    {
        Task Delete(int id);
        Task<ClientEditModelCollectionView> Query(ClientQuery query);
        Task<ClientEditModel> Get(int id);
        Task Add([FromBody] ClientInput value);
        Task Update(int id, [FromBody] ClientInput value);
        Task<CreateSecretResult> CreateSecret(int id);
        Task SetClientSecret(int id, string secretString);
        Task AddOrUpdateWithSecret(ClientInput value, string secret);
    }
}
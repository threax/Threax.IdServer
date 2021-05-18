using System;
using System.Threading.Tasks;
using Threax.IdServer.InputModels;
using Threax.IdServer.Models.Api;

namespace Threax.IdServer.Repository
{
    public interface IIdServerUserRepository
    {
        Task<IdServerUserView> Get(Guid userId);
        Task<IdServerUserCollection> List(IdServerUserQuery query);
    }
}
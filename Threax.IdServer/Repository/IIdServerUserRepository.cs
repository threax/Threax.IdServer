using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Threax.IdServer.Data;
using Threax.IdServer.InputModels;
using Threax.IdServer.Models.Api;
using Threax.IdServer.Services;

namespace Threax.IdServer.Repository
{
    public interface IIdServerUserRepository
    {
        Task<IdServerUserView> Get(Guid userId);
        Task<IdServerUserCollection> List(IdServerUserQuery query);
    }
}
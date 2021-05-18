using AutoMapper;
using IdentityServer4.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;
using Threax.IdServer.Areas.Api.InputModels;
using Threax.IdServer.Areas.Api.Models;
using Threax.IdServer.EntityFramework.DbContexts;
using Threax.IdServer.EntityFramework.Entities;
using Threax.IdServer.InputModels;

namespace Threax.IdServer.Repository
{
    public class ClientRepository : IClientRepository
    {
        private ConfigurationDbContext configDb;
        private IMapper mapper;
        private readonly AppConfig appConfig;

        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="mapper">The mapper.</param>
        /// <param name="configDb">The configuration db context.</param>
        /// <param name="appConfig">The app config.</param>
        public ClientRepository(ConfigurationDbContext configDb, IMapper mapper, AppConfig appConfig)
        {
            this.configDb = configDb;
            this.mapper = mapper;
            this.appConfig = appConfig;
        }

        public async Task<ClientEditModelCollectionView> Query(ClientQuery query)
        {
            if (query.Id != null)
            {
                var client = await Get(query.Id.Value);
                if (client == null)
                {
                    return new ClientEditModelCollectionView(query, 0, Enumerable.Empty<ClientEditModel>());
                }
                return new ClientEditModelCollectionView(query, 1, new ClientEditModel[] { client });
            }

            //Don't want secrets here
            IQueryable<Client> clients = configDb.Clients
                                  .Include(i => i.RedirectUris)
                                  .Include(i => i.AllowedScopes);

            if (!String.IsNullOrEmpty(query.ClientId))
            {
                clients = clients.Where(i => EF.Functions.Like(i.ClientId, $"%{query.ClientId}%"));
            }

            if (query.GrantTypes != null)
            {
                GrantTypes grantTypes = 0;
                foreach(var i in query.GrantTypes)
                {
                    grantTypes |= i;
                }
                clients = clients.Where(i => (i.AllowedGrantTypes & grantTypes) != 0);
            }

            if (query.HasMissingOrDefaultSecret == true)
            {
                var hash = appConfig.DefaultSecret.Sha256();
                clients = clients.Where(i => !i.ClientSecrets.Any() || i.ClientSecrets.Where(j => j.Secret == hash).Any());
            }

            int total = await clients.CountAsync();
            clients = clients.OrderBy(i => i.ClientId);
            var results = clients.Skip(query.SkipTo(total)).Take(query.Limit);
            var items = await results.Select(c => mapper.Map<ClientEditModel>(c)).ToListAsync();

            return new ClientEditModelCollectionView(query, total, items);
        }

        public async Task<ClientEditModel> Get(int id)
        {
            //Don't want secrets here
            var clients = configDb.Clients
                                  .Include(i => i.RedirectUris)
                                  .Include(i => i.AllowedScopes)
                                  .Where(i => i.Id == id);
            var client = await clients.FirstOrDefaultAsync();
            return mapper.Map<ClientEditModel>(client);
        }

        public async Task Add(ClientInput value)
        {
            var entity = mapper.Map<Client>(value);

            //Any new client gets the secret notyetdefined
            if (entity.ClientSecrets == null || entity.ClientSecrets.Count == 0)
            {
                entity.ClientSecrets = new List<ClientSecret>()
                {
                    new ClientSecret()
                    {
                        Secret = appConfig.DefaultSecret.Sha256(),
                    }
                };
            }

            configDb.Clients.Add(entity);
            await configDb.SaveChangesAsync();
        }

        public async Task Update(int id, ClientInput value)
        {
            var client = await GetFullClientEntity(id);
            if (client == null)
            {
                throw new InvalidOperationException($"Cannot find client with id '{id}'.");
            }

            mapper.Map<ClientInput, Client>(value, client);
            configDb.Clients.Update(client);
            await configDb.SaveChangesAsync();
        }

        public async Task AddOrUpdateWithSecret(ClientInput value, String secret)
        {
            var clientSecret = HashExtensions.Sha256(secret);

            var existing = await SelectFullEntity().Where(i => i.ClientId == value.ClientId).FirstOrDefaultAsync();
            if(existing == null)
            {
                var entity = mapper.Map<Client>(value);

                entity.ClientSecrets = new List<ClientSecret>()
                {
                    new ClientSecret()
                    {
                        Secret = clientSecret,
                    }
                };

                configDb.Clients.Add(entity);
            }
            else
            {
                mapper.Map<ClientInput, Client>(value, existing);
                existing.ClientSecrets.Clear();
                existing.ClientSecrets.Add(new ClientSecret()
                {
                    Secret = clientSecret
                });
                configDb.Clients.Update(existing);
            }

            await configDb.SaveChangesAsync();
        }

        public async Task Delete(int id)
        {
            var client = await GetFullClientEntity(id);
            if (client == null)
            {
                throw new InvalidOperationException($"Cannot find a client to delete to with id {id}.");
            }
            configDb.Clients.Remove(client);
            await configDb.SaveChangesAsync();
        }

        /// <summary>
        /// Create a secret, save it in the db and return it.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public async Task<CreateSecretResult> CreateSecret(int id)
        {
            using (var numberGen = RandomNumberGenerator.Create()) //This is more portable than from services since that does not work on linux correctly
            {
                var bytes = new byte[32];
                numberGen.GetBytes(bytes);

                var secret = Convert.ToBase64String(bytes);
                await SetClientSecret(id, secret);
                return new CreateSecretResult()
                {
                    Secret = secret
                };
            }
        }

        public async Task SetClientSecret(int id, String secretString)
        {
            var client = await GetFullClientEntity(id);
            if (client == null)
            {
                throw new InvalidOperationException($"Cannot find a client to add a secret to with id {id}.");
            }

            var secret = HashExtensions.Sha256(secretString);

            client.ClientSecrets.Clear();
            client.ClientSecrets.Add(new ClientSecret()
            {
                Secret = secret
            });
            configDb.Clients.Update(client);
            await configDb.SaveChangesAsync();
        }

        private Task<Client> GetFullClientEntity(int id)
        {
            return SelectFullEntity().Where(i => i.Id == id).FirstOrDefaultAsync();
        }

        private IQueryable<Client> SelectFullEntity()
        {
            return configDb.Clients
                            .Include(i => i.RedirectUris)
                            .Include(i => i.AllowedScopes)
                            .Include(i => i.ClientSecrets);
        }
    }
}

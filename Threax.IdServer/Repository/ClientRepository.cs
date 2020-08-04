using AutoMapper;
using IdentityServer4.EntityFramework.Entities;
using IdentityServer4.EntityFramework.Interfaces;
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
using Threax.IdServer.InputModels;

namespace Threax.IdServer.Repository
{
    public class ClientRepository : IClientRepository
    {
        private IConfigurationDbContext configDb;
        private IMapper mapper;
        private readonly AppConfig appConfig;

        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="mapper">The mapper.</param>
        /// <param name="configDb">The configuration db context.</param>
        public ClientRepository(IConfigurationDbContext configDb, IMapper mapper, AppConfig appConfig)
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
            IQueryable<IdentityServer4.EntityFramework.Entities.Client> clients = configDb.Clients
                                  .Include(i => i.AllowedGrantTypes)
                                  .Include(i => i.RedirectUris)
                                  .Include(i => i.AllowedScopes);

            if (!String.IsNullOrEmpty(query.ClientId))
            {
                clients = clients.Where(i => EF.Functions.Like(i.ClientId, $"%{query.ClientId}%"));
            }

            if (query.GrantTypes != null && query.GrantTypes.Count > 0)
            {
                clients = clients.Where(i => i.AllowedGrantTypes.Any(j => query.GrantTypes.Contains(j.GrantType)));
            }

            if (query.HasMissingOrDefaultSecret == true)
            {
                var hash = appConfig.DefaultSecret.Sha256();
                clients = clients.Where(i => !i.ClientSecrets.Any() || i.ClientSecrets.Where(j => j.Value == hash).Any());
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
                                  .Include(i => i.AllowedGrantTypes)
                                  .Include(i => i.RedirectUris)
                                  .Include(i => i.AllowedScopes)
                                  .Where(i => i.Id == id);
            var client = await clients.FirstOrDefaultAsync();
            return mapper.Map<ClientEditModel>(client);
        }

        public async Task Add(ClientInput value)
        {
            var entity = mapper.Map<IdentityServer4.EntityFramework.Entities.Client>(value);

            //Any new client gets the secret notyetdefined
            if (entity.ClientSecrets == null)
            {
                entity.ClientSecrets = new List<ClientSecret>()
                {
                    new ClientSecret()
                    {
                        Client = entity,
                        Value = appConfig.DefaultSecret.Sha256(),
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

            mapper.Map<ClientInput, IdentityServer4.EntityFramework.Entities.Client>(value, client);
            configDb.Clients.Update(client);
            await configDb.SaveChangesAsync();
        }

        public async Task AddOrUpdateWithSecret(ClientInput value, String secret)
        {
            var clientSecret = new IdentityServer4.Models.Secret(IdentityServer4.Models.HashExtensions.Sha256(secret));

            var existing = await SelectFullEntity().Where(i => i.ClientId == value.ClientId).FirstOrDefaultAsync();
            if(existing == null)
            {
                var entity = mapper.Map<IdentityServer4.EntityFramework.Entities.Client>(value);

                entity.ClientSecrets = new List<ClientSecret>()
                {
                    new ClientSecret()
                    {
                        Client = entity,
                        Value = clientSecret.Value,
                        Description = clientSecret.Description,
                        Expiration = clientSecret.Expiration,
                        Type = clientSecret.Type
                    }
                };

                configDb.Clients.Add(entity);
            }
            else
            {
                mapper.Map<ClientInput, IdentityServer4.EntityFramework.Entities.Client>(value, existing);
                existing.ClientSecrets.Clear();
                existing.ClientSecrets.Add(new ClientSecret()
                {
                    Client = existing,
                    Value = clientSecret.Value,
                    Description = clientSecret.Description,
                    Expiration = clientSecret.Expiration,
                    Type = clientSecret.Type
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

            var secret = new IdentityServer4.Models.Secret(IdentityServer4.Models.HashExtensions.Sha256(secretString));

            client.ClientSecrets.Clear();
            client.ClientSecrets.Add(new ClientSecret()
            {
                Client = client,
                Value = secret.Value,
                Description = secret.Description,
                Expiration = secret.Expiration,
                Type = secret.Type
            });
            configDb.Clients.Update(client);
            await configDb.SaveChangesAsync();
        }

        private Task<IdentityServer4.EntityFramework.Entities.Client> GetFullClientEntity(int id)
        {
            return SelectFullEntity().Where(i => i.Id == id).FirstOrDefaultAsync();
        }

        private IQueryable<IdentityServer4.EntityFramework.Entities.Client> SelectFullEntity()
        {
            return configDb.Clients
                            .Include(i => i.AllowedGrantTypes)
                            .Include(i => i.RedirectUris)
                            .Include(i => i.AllowedScopes)
                            .Include(i => i.ClientSecrets);
        }
    }
}

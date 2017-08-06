using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TestApi.Database;
using TestApi.InputModels;
using TestApi.ViewModels;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Threax.AspNetCore.Halcyon.Ext;

namespace TestApi.Repository
{
    public partial class HorribleBeastRepository : IHorribleBeastRepository
    {
        private AppDbContext dbContext;
        private IMapper mapper;

        public HorribleBeastRepository(AppDbContext dbContext, IMapper mapper)
        {
            this.dbContext = dbContext;
            this.mapper = mapper;
        }

        public async Task<HorribleBeastCollection> List(PagedCollectionQuery query)
        {
            IQueryable<HorribleBeastEntity> dbQuery = this.Entities;

            var total = await dbQuery.CountAsync();
            dbQuery = dbQuery.Skip(query.SkipTo(total)).Take(query.Limit);
            var resultQuery = dbQuery.Select(i => mapper.Map<HorribleBeast>(i));
            var results = await resultQuery.ToListAsync();

            return new HorribleBeastCollection(query, total, results);
        }

        public async Task<HorribleBeast> Get(Guid horribleBeastId)
        {
            var entity = await this.Entity(horribleBeastId);
            return mapper.Map<HorribleBeast>(entity);
        }

        public async Task<HorribleBeast> Add(HorribleBeastInput horribleBeast)
        {
            var entity = mapper.Map<HorribleBeastEntity>(horribleBeast);
            this.dbContext.Add(entity);
            await this.dbContext.SaveChangesAsync();
            return mapper.Map<HorribleBeast>(entity);
        }

        public async Task<HorribleBeast> Update(Guid horribleBeastId, HorribleBeastInput horribleBeast)
        {
            var entity = await this.Entity(horribleBeastId);
            if (entity != null)
            {
                mapper.Map(horribleBeast, entity);
                await this.dbContext.SaveChangesAsync();
                return mapper.Map<HorribleBeast>(entity);
            }
            throw new KeyNotFoundException($"Cannot find item {horribleBeastId.ToString()}");
        }

        public async Task Delete(Guid id)
        {
            var entity = await this.Entity(id);
            if (entity != null)
            {
                Entities.Remove(entity);
                await this.dbContext.SaveChangesAsync();
            }
        }

        public virtual async Task<bool> HasHorribleBeasts()
        {
            return await Entities.CountAsync() > 0;
        }

        public virtual async Task AddRange(IEnumerable<HorribleBeastInput> horribleBeasts)
        {
            var entities = horribleBeasts.Select(i => mapper.Map<HorribleBeastEntity>(i));
            this.dbContext.HorribleBeasts.AddRange(entities);
            await this.dbContext.SaveChangesAsync();
        }

        private DbSet<HorribleBeastEntity> Entities
        {
            get
            {
                return dbContext.HorribleBeasts;
            }
        }

        private Task<HorribleBeastEntity> Entity(Guid horribleBeastId)
        {
            return Entities.Where(i => i.HorribleBeastId == horribleBeastId).FirstOrDefaultAsync();
        }
    }
}
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
    public partial class ValueRepository : IValueRepository
    {
        private AppDbContext dbContext;
        private IMapper mapper;

        public ValueRepository(AppDbContext dbContext, IMapper mapper)
        {
            this.dbContext = dbContext;
            this.mapper = mapper;
        }

        public async Task<ValueCollection> List(PagedCollectionQuery query)
        {
            IQueryable<ValueEntity> dbQuery = this.Entities;

            var total = await dbQuery.CountAsync();
            dbQuery = dbQuery.Skip(query.SkipTo(total)).Take(query.Limit);
            var resultQuery = dbQuery.Select(i => mapper.Map<Value>(i));
            var results = await resultQuery.ToListAsync();

            return new ValueCollection(query, total, results);
        }

        public async Task<Value> Get(Guid valueId)
        {
            var entity = await this.Entity(valueId);
            return mapper.Map<Value>(entity);
        }

        public async Task<Value> Add(ValueInput value)
        {
            var entity = mapper.Map<ValueEntity>(value);
            this.dbContext.Add(entity);
            await this.dbContext.SaveChangesAsync();
            return mapper.Map<Value>(entity);
        }

        public async Task<Value> Update(Guid valueId, ValueInput value)
        {
            var entity = await this.Entity(valueId);
            if (entity != null)
            {
                mapper.Map(value, entity);
                await this.dbContext.SaveChangesAsync();
                return mapper.Map<Value>(entity);
            }
            throw new KeyNotFoundException($"Cannot find item {valueId.ToString()}");
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

        public virtual async Task<bool> HasValues()
        {
            return await Entities.CountAsync() > 0;
        }

        public virtual async Task AddRange(IEnumerable<ValueInput> values)
        {
            var entities = values.Select(i => mapper.Map<ValueEntity>(i));
            this.dbContext.Values.AddRange(entities);
            await this.dbContext.SaveChangesAsync();
        }

        private DbSet<ValueEntity> Entities
        {
            get
            {
                return dbContext.Values;
            }
        }

        private Task<ValueEntity> Entity(Guid valueId)
        {
            return Entities.Where(i => i.ValueId == valueId).FirstOrDefaultAsync();
        }
    }
}
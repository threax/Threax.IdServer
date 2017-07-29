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
using Threax.AspNetCore.Crud;
using Threax.AspNetCore.Halcyon.Ext;

namespace TestApi.Repository
{
    /// <summary>
    /// This shows how to use the CrudRepo base class to implement a crud repository for values.
    /// </summary>
    public class ValueRepository : CrudRepo<Guid, PagedCollectionQuery, ValueInput, ValueEntity, Value, ValueCollection, AppDbContext>, IValueRepository
    {
        public ValueRepository(AppDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        /// <summary>
        /// Get the list of all entities, usually good enough to return just the DbSet from the DbContext.
        /// </summary>
        protected override DbSet<ValueEntity> Entities
        {
            get
            {
                return DbContext.Values;
            }
        }

        /// <summary>
        /// Create the result collection. Since this is defined in your app it must be constructed somewhere.
        /// </summary>
        /// <param name="query">The query that was used to build the results.</param>
        /// <param name="total">The total number of results.</param>
        /// <param name="results">The actual results.</param>
        /// <returns></returns>
        protected override ValueCollection CreateCollection(PagedCollectionQuery query, int total, IEnumerable<Value> results)
        {
            return new ValueCollection(query, total, results);
        }

        /// <summary>
        /// Find an individual entity by id.
        /// </summary>
        /// <param name="key">The key to lookup.</param>
        /// <returns>The entity.</returns>
        protected override Task<ValueEntity> Entity(Guid key)
        {
            return Entities.Where(i => i.ValueId == key).FirstOrDefaultAsync();
        }
    }
}

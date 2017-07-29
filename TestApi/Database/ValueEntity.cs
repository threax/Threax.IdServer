using TestApi.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace TestApi.Database
{
    /// <summary>
    /// The entity for value, the only difference here is it is not added to the dbcontext
    /// since it is here as an example, the ValueRepository handles the differences so you
    /// don't have worthless dbcontext migrations with this junk data.
    /// </summary>
    public class ValueEntity : IValue, IValueId
    {
        [Key]
        public Guid ValueId { get; set; }

        public string Name { get; set; }
    }
}

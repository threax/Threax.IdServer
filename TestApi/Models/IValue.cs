using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TestApi.Models
{
    /// <summary>
    /// This interface defines common properties shared between all of our Value representations.
    /// </summary>
    public interface IValue
    {
        /// <summary>
        /// A name for the value.
        /// </summary>
        String Name { get; set; }
    }

    /// <summary>
    /// The id version is separate, input models do not need ids to work so separating out that field helps.
    /// </summary>
    public interface IValueId
    {
        /// <summary>
        /// The id of the value.
        /// </summary>
        Guid ValueId { get; set; }
    }
}

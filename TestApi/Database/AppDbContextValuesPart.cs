using Microsoft.EntityFrameworkCore;

namespace TestApi.Database
{
    public partial class AppDbContext
    {
        public DbSet<ValueEntity> Values { get; set; }
    }
}

using Microsoft.EntityFrameworkCore;

namespace TestApi.Database
{
    public partial class AppDbContext
    {
        public DbSet<HorribleBeastEntity> HorribleBeasts { get; set; }
    }
}

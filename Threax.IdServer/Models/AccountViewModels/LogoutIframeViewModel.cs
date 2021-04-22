using System.Collections.Generic;

namespace Threax.IdServer.Models.AccountViewModels
{
    public class LogoutIframeViewModel
    {
        public IEnumerable<string> LogoutCallbackUrls { get; set; }
    }
}
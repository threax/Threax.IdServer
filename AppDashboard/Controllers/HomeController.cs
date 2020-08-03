using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Threax.AspNetCore.IdServerAuth;
using Threax.AspNetCore.UserBuilder.Entities;
using Threax.AspNetCore.Mvc.CacheUi;

namespace AppDashboard.Controllers
{
    [Authorize(AuthenticationSchemes = AuthCoreSchemes.Cookies)]
    public class HomeController : CacheUiController
    {
        public HomeController(ICacheUiBuilder builder)
            : base(builder)
        {

        }

        public Task<IActionResult> Index()
        {
            return CacheUiView();
        }

        public Task<IActionResult> Header()
        {
            return CacheUiView();
        }

        public Task<IActionResult> Footer()
        {
            return CacheUiView();
        }

        [Authorize(Roles = Roles.EditClients)]
        public IActionResult Clients()
        {
            return View();
        }

        [Authorize(Roles = Roles.EditApiResources)]
        public IActionResult ApiResources()
        {
            return View();
        }

        [Authorize(Roles = AuthorizationAdminRoles.EditRoles)]
        public IActionResult UserRoles()
        {
            return View();
        }

        [AllowAnonymous]
        public IActionResult AccessDenied()
        {
            return View();
        }

        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutOfIdServer();

            return View();
        }
    }
}

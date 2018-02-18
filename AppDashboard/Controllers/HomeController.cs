﻿using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Threax.AspNetCore.IdServerAuth;

namespace OlsAppDashboard.Controllers
{
    [Authorize(AuthenticationSchemes = AuthCoreSchemes.Cookies)]
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
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

        [Authorize]
        public IActionResult Users()
        {
            return View();
        }

        [Authorize]
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
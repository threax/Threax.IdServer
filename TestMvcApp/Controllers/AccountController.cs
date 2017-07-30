using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TestMvcApp.Controllers
{
    public class AccountController : Controller
    {
        [Authorize]
        public IActionResult Relogin()
        {
            return View();
        }

        public IActionResult AccessDenied()
        {
            return View();
        }

        public IActionResult Logout()
        {
            //This function triggers the logout on the server
            return SignOut("oidc");
        }
    }
}

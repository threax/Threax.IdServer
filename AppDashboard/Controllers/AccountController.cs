using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OlsAppDashboard.Controllers
{
    public class AccountController : Controller
    {
        [Authorize(AuthenticationSchemes = AuthCoreSchemes.Cookies)]
        public IActionResult Relogin()
        {
            return View();
        }

        public IActionResult AccessDenied()
        {
            return View();
        }
    }
}

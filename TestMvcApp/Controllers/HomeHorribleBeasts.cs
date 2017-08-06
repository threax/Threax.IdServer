using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace TestMvcApp.Controllers
{
    public partial class HomeController
    {
        public IActionResult HorribleBeasts()
        {
            return View();
        }
    }
}
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.Extensions.Logging;
//using Spc.AspNetCore.JwtAuthentication;
//using Threax.IdServer.Areas.Api.Models;
//using Threax.IdServer.Config;
//using Threax.IdServer.Models;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Net;
//using System.Text;
//using System.Threading.Tasks;
//using Threax.AspNetCore.ExceptionFilter;
//using Threax.AspNetCore.Halcyon.Ext;

//namespace Threax.IdServer.Areas.Api.Controllers
//{
//    [Authorize(Roles = Roles.EditClients, AuthenticationSchemes = AuthCoreSchemes.Bearer)]
//    [Route("[controller]")]
//    [Area("Api")]
//    [ResponseCache(NoStore = true)]
//    public class ExternalUsersController : Controller
//    {
//        private readonly UserManager<ExternalUser> userManager;
//        private readonly SignInManager<ExternalUser> signInManager;
//        private readonly ILogger logger;

//        public ExternalUsersController(
//            UserManager<ExternalUser> userManager,
//            SignInManager<ExternalUser> signInManager,
//            ILoggerFactory loggerFactory)
//        {
//            this.userManager = userManager;
//            this.signInManager = signInManager;
//            this.logger = loggerFactory.CreateLogger<ExternalUsersController>();
//        }

//        [HttpGet]
//        [AllowAnonymous]
//        [HalRel(GetSetRels.Get)]
//        public RegisterEditModel BeginRegister()
//        {
//            return new RegisterEditModel();
//        }

//        [HttpPost]
//        [AllowAnonymous]
//        [AutoValidate("Invalid account info")]
//        [HalRel(GetSetRels.Set)]
//        public async Task<RegisterEditModel> Register([FromBody] RegisterEditModel model)
//        {
//            var user = new ExternalUser
//            {
//                UserName = model.Email,
//                Email = model.Email,
//                FirstName = model.FirstName,
//                LastName = model.LastName
//            };
//            var result = await userManager.CreateAsync(user, model.Password);
//            if (result.Succeeded)
//            {
//                var signInResult = await signInManager.PasswordSignInAsync(model.Email, model.Password, false, lockoutOnFailure: true);
//                logger.LogInformation(3, "User created a new account with password.");

//                model.ClearPassword();

//                return model;
//            }
//            else
//            {
//                StringBuilder sb = new StringBuilder();
//                sb.AppendLine("Could not create account. Reasons:");
//                foreach (var error in result.Errors)
//                {
//                    sb.AppendLine($"{error.Description}");
//                }
//                throw new ErrorResultException(sb.ToString(), HttpStatusCode.InternalServerError);
//            }
//        }
//    }
//}

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Threax.AspNetCore.RazorExt;
using Threax.IdServer.EntityFramework.Entities;
using Threax.IdServer.Models;
using Threax.IdServer.Models.AccountViewModels;
using Threax.IdServer.Services;

namespace Threax.IdServer.Controllers
{
    public class AccountController : Controller
    {
        private readonly UserManager<ApplicationUser> userManager;
        private readonly SignInManager<ApplicationUser> signInManager;
        private readonly ILogger logger;
        private readonly IAuthenticationSchemeProvider schemeProvider;
        private readonly IRazorViewStringRenderer razorViewStringRenderer;
        private readonly IEmailSender emailSender;

        public AccountController(
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            ILoggerFactory loggerFactory,
            IAuthenticationSchemeProvider schemeProvider,
            IRazorViewStringRenderer razorViewStringRenderer,
            IEmailSender emailSender)
        {
            this.signInManager = signInManager;
            this.userManager = userManager;
            logger = loggerFactory.CreateLogger<AccountController>();
            this.schemeProvider = schemeProvider;
            this.razorViewStringRenderer = razorViewStringRenderer;
            this.emailSender = emailSender;
        }

        /// <summary>
        /// Show login page
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> Login(string returnUrl)
        {
            var vm = await BuildLoginViewModelAsync(returnUrl);

            return View(vm);
        }

        /// <summary>
        /// Handle postback from username/password login
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginInputModel model)
        {
            if (ModelState.IsValid)
            {
                // This doesn't count login failures towards account lockout
                // To enable password failures to trigger account lockout, set lockoutOnFailure: true
                var result = await signInManager.PasswordSignInAsync(model.Email, model.Password, false, lockoutOnFailure: true);
                if (result.Succeeded)
                {
                    var user = await userManager.FindByNameAsync(model.Email);
                    await SignInUser(user);

                    //Redirect
                    logger.LogInformation(1, "User logged in.");
                    if (model.ReturnUrl == null)
                    {
                        model.ReturnUrl = "/";
                    }
                    return Redirect(model.ReturnUrl);
                }
                if (result.IsLockedOut)
                {
                    logger.LogWarning(2, "User account locked out.");
                    ModelState.AddModelError("", "User account locked out.");
                }
                else
                {
                    ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                    ModelState.AddModelError("", "Invalid login attempt.");
                }
            }

            var vm = await BuildLoginViewModelAsync(model);
            return View(vm);
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult Register(string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel model, string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            if (ModelState.IsValid)
            {
                var user = new ApplicationUser { UserName = model.Email, Email = model.Email };
                var result = await userManager.CreateAsync(user, model.Password);
                if (result.Succeeded)
                {
                    logger.LogInformation("User created a new account with password.");

                    //var code = await userManager.GenerateEmailConfirmationTokenAsync(user);
                    //var callbackUrl = Url.EmailConfirmationLink(user.Id, code, Request.Scheme);
                    //await emailSender.SendEmailConfirmationAsync(model.Email, callbackUrl);

                    await SignInUser(user);
                    logger.LogInformation("User created a new account with password.");
                    return RedirectToLocal(returnUrl);
                }
                AddErrors(result);
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        private Task<LoginViewModel> BuildLoginViewModelAsync(string returnUrl)
        {
            return Task.FromResult(new LoginViewModel
            {
                ReturnUrl = returnUrl
            });
        }

        private async Task<LoginViewModel> BuildLoginViewModelAsync(LoginInputModel model)
        {
            var vm = await BuildLoginViewModelAsync(model.ReturnUrl);
            vm.Email = model.Email;
            return vm;
        }

        private void AddErrors(IdentityResult result)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
        }

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                return RedirectToAction(nameof(HomeController.Index), "Home");
            }
        }

        [HttpPost]
        public IActionResult AccessToken()
        {
            return new EmptyResult();
        }

        private async Task SignInUser(ApplicationUser user)
        {
            var claims = new List<Claim>();

            //Setup claims for user
            claims.Add(new Claim("sub", user.Id.ToString()));
            claims.Add(new Claim("username", user.UserName));

            // issue authentication cookie for user
            var provider = await schemeProvider.GetDefaultAuthenticateSchemeAsync();
            var claimsIdentity = new ClaimsIdentity(claims, provider.Name, "username", ClaimsIdentity.DefaultRoleClaimType);
            var principal = new ClaimsPrincipal(claimsIdentity);

            await HttpContext.SignInAsync(provider.Name, principal);
        }

        [HttpGet]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordViewModel forgotPasswordModel)
        {
            if (!ModelState.IsValid)
            {
                return View(forgotPasswordModel);
            }

            var user = await userManager.FindByEmailAsync(forgotPasswordModel.Email);
            if (user == null)
            {
                return RedirectToAction(nameof(ForgotPasswordConfirmation));
            }

            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var emailModel = new ResetPasswordEmail()
            {
                Token = token,
                Email = user.Email
            };

            var message = await razorViewStringRenderer.RenderAsync("Views/Emails/ResetPassword.cshtml", emailModel);
            await emailSender.SendEmailAsync(user.Email, "Password Reset", message);

            return RedirectToAction(nameof(ForgotPasswordConfirmation));
        }

        public IActionResult ForgotPasswordConfirmation()
        {
            return View();
        }

        [HttpGet]
        public IActionResult ResetPassword(string token, string email)
        {
            var model = new ResetPasswordViewModel { Token = token, Email = email };
            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetPassword(ResetPasswordViewModel resetPasswordModel)
        {
            if (!ModelState.IsValid)
            {
                return View(resetPasswordModel);
            }
            
            var user = await userManager.FindByEmailAsync(resetPasswordModel.Email);
            if (user == null)
            {
                RedirectToAction(nameof(ResetPasswordConfirmation));
            }
            
            var resetPassResult = await userManager.ResetPasswordAsync(user, resetPasswordModel.Token, resetPasswordModel.Password);
            if (!resetPassResult.Succeeded)
            {
                foreach (var error in resetPassResult.Errors)
                {
                    ModelState.TryAddModelError(error.Code, error.Description);
                }
                return View();
            }
            return RedirectToAction(nameof(ResetPasswordConfirmation));
        }

        [HttpGet]
        public IActionResult ResetPasswordConfirmation()
        {
            return View();
        }
    }
}
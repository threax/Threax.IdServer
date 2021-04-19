// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.


using IdentityModel;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Threax.IdServer;
using Threax.IdServer.Controllers;
using Threax.IdServer.Models;
using Threax.IdServer.Models.AccountViewModels;

namespace IdentityServer4.Quickstart.UI.Controllers
{
    /// <summary>
    /// This sample controller implements a typical login/logout/provision workflow for local and external accounts.
    /// The login service encapsulates the interactions with the user data store. This data store is in-memory only and cannot be used for production!
    /// The interaction service provides a way for the UI to communicate with identityserver for validation and context retrieval
    /// </summary>
    public class AccountController : Controller
    {
        private readonly UserManager<ApplicationUser> userManager;
        private readonly SignInManager<ApplicationUser> signInManager;
        private readonly ILogger logger;
        private IAuthenticationSchemeProvider schemeProvider;

        public AccountController(
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            ILoggerFactory loggerFactory,
            IAuthenticationSchemeProvider schemeProvider)
        {
            this.signInManager = signInManager;
            this.userManager = userManager;
            logger = loggerFactory.CreateLogger<AccountController>();
            this.schemeProvider = schemeProvider;
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
                    var claims = new List<Claim>();

                    //Setup claims for user
                    claims.Add(new Claim("sub", user.Id.ToString()));
                    claims.Add(new Claim(Threax.AspNetCore.AuthCore.ClaimTypes.ObjectGuid, user.Id.ToString()));
                    claims.Add(new Claim("username", user.UserName));

                    // issue authentication cookie for user
                    var provider = await schemeProvider.GetDefaultAuthenticateSchemeAsync();
                    var claimsIdentity = new ClaimsIdentity(claims, provider.Name, "username", ClaimsIdentity.DefaultRoleClaimType);
                    var principal = new ClaimsPrincipal(claimsIdentity);

                    await HttpContext.SignInAsync(provider.Name, principal);

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

        /// <summary>
        /// initiate roundtrip to external authentication provider. The external provide is
        /// the adfs node, so the external here stands for where users come from from the 
        /// id server's perspective.
        /// </summary>
        [HttpGet]
        public IActionResult External(string provider, string returnUrl)
        {
            if (returnUrl != null)
            {
                returnUrl = UrlEncoder.Default.Encode(returnUrl);
            }
            returnUrl = "/account/externalcallback?returnUrl=" + returnUrl;

            // start challenge and roundtrip the return URL
            return new ChallengeResult(provider, new AuthenticationProperties
            {
                RedirectUri = returnUrl
            });
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

                    await signInManager.SignInAsync(user, isPersistent: false);
                    logger.LogInformation("User created a new account with password.");
                    return RedirectToLocal(returnUrl);
                }
                AddErrors(result);
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        /// <summary>
        /// Show logout page
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> Logout(string logoutId)
        {
            //Find the user in the local storage
            ApplicationUser user = null;
            if (HttpContext.User.Identity != null && HttpContext.User.Identity.Name != null)
            {
                user = await userManager.FindByNameAsync(HttpContext.User.Identity.Name);
            }
            //If they are not found, throw an exception
            if (user == null)
            {
                throw new InvalidOperationException($"Cannot find user {HttpContext.User.Identity.Name}");
            }

            // delete authentication cookie
            await HttpContext.SignOutAsync((await schemeProvider.GetDefaultAuthenticateSchemeAsync()).Name);

            // set this so UI rendering sees an anonymous user
            HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());

            throw new InvalidOperationException("Need to implement OpenIddict logout");

            //// get context information (client name, post logout redirect URI and iframe for federated signout)
            //var logout = await interaction.GetLogoutContextAsync(logoutId);

            //var vm = new LoggedOutViewModel
            //{
            //    PostLogoutRedirectUri = logout?.PostLogoutRedirectUri,
            //    ClientName = logout?.ClientId,
            //    SignOutIframeUrl = logout?.SignOutIFrameUrl
            //};

            //return View("LoggedOut", vm);
        }

        /// <summary>
        /// This function adds a potato p3p header to make ie happy when setting cookies in iframes.
        /// </summary>
        private void addPotato()
        {
            Response.Headers.Add("P3P", "CP=\"Potato\""); //For IE iframe cookies
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
    }
}
﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Threax.IdServer.EntityFramework.DbContexts;
using Threax.IdServer.EntityFramework.Entities;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Primitives;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using Threax.AspNetCore.CSP;
using Threax.IdServer.Extensions;
using Threax.IdServer.Models;
using Threax.IdServer.Models.AccountViewModels;
using Threax.IdServer.Repository;
using Threax.IdServer.Services;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Threax.IdServer.Controllers
{
    public class AuthorizationController : Controller
    {
        private const string CurrentClients = "Idserver.CurrentClients";
        private const string AllowLogout = "IdServer.AllowLogout";
        private const string AllowLogoutTrue = "true";

        private readonly IOpenIddictApplicationManager _applicationManager;
        private readonly IOpenIddictAuthorizationManager _authorizationManager;
        private readonly IOpenIddictScopeManager _scopeManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IApplicationGuidFactory guidFactory;
        private readonly ConfigurationDbContext configDb;

        public AuthorizationController(
            IOpenIddictApplicationManager applicationManager,
            IOpenIddictAuthorizationManager authorizationManager,
            IOpenIddictScopeManager scopeManager,
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            IApplicationGuidFactory guidFactory,
            ConfigurationDbContext configDb)
        {
            _applicationManager = applicationManager;
            _authorizationManager = authorizationManager;
            _scopeManager = scopeManager;
            _signInManager = signInManager;
            _userManager = userManager;
            this.guidFactory = guidFactory;
            this.configDb = configDb;
        }

        #region Authorization code, implicit and hybrid flows
        // Note: to support interactive flows like the code flow,
        // you must provide your own authorization endpoint action:

        [HttpGet("~/connect/authorize")]
        [HttpPost("~/connect/authorize")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> Authorize()
        {
            var request = HttpContext.GetOpenIddictServerRequest() ??
                throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

            // Retrieve the user principal stored in the authentication cookie.
            // If it can't be extracted, redirect the user to the login page.
            var result = await HttpContext.AuthenticateAsync(IdentityConstants.ApplicationScheme);
            if (result is null || !result.Succeeded)
            {
                // If the client application requested promptless authentication,
                // return an error indicating that the user is not logged in.
                if (request.HasPrompt(Prompts.None))
                {
                    return Forbid(
                        authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                        properties: new AuthenticationProperties(new Dictionary<string, string>
                        {
                            [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.LoginRequired,
                            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The user is not logged in."
                        }));
                }

                return Challenge(
                    authenticationSchemes: IdentityConstants.ApplicationScheme,
                    properties: new AuthenticationProperties
                    {
                        RedirectUri = Request.PathBase + Request.Path + QueryString.Create(
                            Request.HasFormContentType ? Request.Form.ToList() : Request.Query.ToList())
                    });
            }

            // If prompt=login was specified by the client application,
            // immediately return the user agent to the login page.
            if (request.HasPrompt(Prompts.Login))
            {
                // To avoid endless login -> authorization redirects, the prompt=login flag
                // is removed from the authorization request payload before redirecting the user.
                var prompt = string.Join(" ", request.GetPrompts().Remove(Prompts.Login));

                var parameters = Request.HasFormContentType ?
                    Request.Form.Where(parameter => parameter.Key != Parameters.Prompt).ToList() :
                    Request.Query.Where(parameter => parameter.Key != Parameters.Prompt).ToList();

                parameters.Add(KeyValuePair.Create(Parameters.Prompt, new StringValues(prompt)));

                return Challenge(
                    authenticationSchemes: IdentityConstants.ApplicationScheme,
                    properties: new AuthenticationProperties
                    {
                        RedirectUri = Request.PathBase + Request.Path + QueryString.Create(parameters)
                    });
            }

            // If a max_age parameter was provided, ensure that the cookie is not too old.
            // If it's too old, automatically redirect the user agent to the login page.
            if (request.MaxAge is not null && result.Properties?.IssuedUtc is not null &&
                DateTimeOffset.UtcNow - result.Properties.IssuedUtc > TimeSpan.FromSeconds(request.MaxAge.Value))
            {
                if (request.HasPrompt(Prompts.None))
                {
                    return Forbid(
                        authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                        properties: new AuthenticationProperties(new Dictionary<string, string>
                        {
                            [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.LoginRequired,
                            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The user is not logged in."
                        }));
                }

                return Challenge(
                    authenticationSchemes: IdentityConstants.ApplicationScheme,
                    properties: new AuthenticationProperties
                    {
                        RedirectUri = Request.PathBase + Request.Path + QueryString.Create(
                            Request.HasFormContentType ? Request.Form.ToList() : Request.Query.ToList())
                    });
            }

            // Retrieve the profile of the logged in user.
            var subject = _userManager.GetUserId(result.Principal);
            var user = await _userManager.FindByIdAsync(subject) ??
                throw new InvalidOperationException("The user details cannot be retrieved.");

            // Retrieve the application details from the database.
            var application = await _applicationManager.FindByClientIdAsync(request.ClientId) ??
                throw new InvalidOperationException("Details concerning the calling client application cannot be found.");

            // Retrieve the permanent authorizations associated with the user and the calling client application.
            var authorizations = await _authorizationManager.FindAsync(
                subject: await _userManager.GetUserIdAsync(user),
                client: await _applicationManager.GetIdAsync(application),
                status: Statuses.Valid,
                type: AuthorizationTypes.Permanent,
                scopes: request.GetScopes()).ToListAsync();

            switch (await _applicationManager.GetConsentTypeAsync(application))
            {
                // If the consent is external (e.g when authorizations are granted by a sysadmin),
                // immediately return an error if no authorization can be found in the database.
                case ConsentTypes.External when !authorizations.Any():
                    return Forbid(
                        authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                        properties: new AuthenticationProperties(new Dictionary<string, string>
                        {
                            [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.ConsentRequired,
                            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] =
                                "The logged in user is not allowed to access this client application."
                        }));

                // If the consent is implicit or if an authorization was found,
                // return an authorization response without displaying the consent form.
                case ConsentTypes.Implicit:
                case ConsentTypes.External when authorizations.Any():
                case ConsentTypes.Explicit when authorizations.Any() && !request.HasPrompt(Prompts.Consent):
                    var principal = await _signInManager.CreateUserPrincipalAsync(user);

                    var claimIdentity = (ClaimsIdentity)principal.Identity;
                    claimIdentity.AddClaim(new Claim(Claims.Subject, subject));

                    // Note: in this sample, the granted scopes match the requested scope
                    // but you may want to allow the user to uncheck specific scopes.
                    // For that, simply restrict the list of scopes before calling SetScopes.
                    principal.SetScopes(request.GetScopes());
                    principal.SetResources(await _scopeManager.ListResourcesAsync(principal.GetScopes()).ToListAsync());

                    // Automatically create a permanent authorization to avoid requiring explicit consent
                    // for future authorization or token requests containing the same scopes.
                    var authorization = authorizations.LastOrDefault();
                    if (authorization is null)
                    {
                        authorization = await _authorizationManager.CreateAsync(
                            principal: principal,
                            subject: await _userManager.GetUserIdAsync(user),
                            client: await _applicationManager.GetIdAsync(application),
                            type: AuthorizationTypes.Permanent,
                            scopes: principal.GetScopes());
                    }

                    principal.SetAuthorizationId(await _authorizationManager.GetIdAsync(authorization));

                    foreach (var claim in principal.Claims)
                    {
                        claim.SetDestinations(GetDestinations(claim, principal));
                    }

                    if (!HttpContext.Request.Cookies.TryGetValue(CurrentClients, out var currentClientsCookie))
                    {
                        currentClientsCookie = "[]";
                    }
                    var currentClients = JsonSerializer.Deserialize<HashSet<String>>(currentClientsCookie);
                    currentClients.Add(request.ClientId);
                    currentClientsCookie = JsonSerializer.Serialize(currentClients);
                    HttpContext.Response.Cookies.Append(CurrentClients, currentClientsCookie, new CookieOptions()
                    {
                        Secure = true,
                        HttpOnly = true,
                        SameSite = SameSiteMode.Lax,
                        Path = "/connect"
                    });

                    return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);

                // At this point, no authorization was found in the database and an error must be returned
                // if the client application specified prompt=none in the authorization request.
                case ConsentTypes.Explicit when request.HasPrompt(Prompts.None):
                case ConsentTypes.Systematic when request.HasPrompt(Prompts.None):
                    return Forbid(
                        authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                        properties: new AuthenticationProperties(new Dictionary<string, string>
                        {
                            [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.ConsentRequired,
                            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] =
                                "Interactive user consent is required."
                        }));

                // In every other case, render the consent form.
                default:
                    throw new InvalidOperationException("No consent form in this app.");
                    //return View(new AuthorizeViewModel
                    //{
                    //    ApplicationName = await _applicationManager.GetLocalizedDisplayNameAsync(application),
                    //    Scope = request.Scope
                    //});
            }
        }

        //[Authorize, FormValueRequired("submit.Accept")]
        //[HttpPost("~/connect/authorize"), ValidateAntiForgeryToken]
        //public async Task<IActionResult> Accept()
        //{
        //    var request = HttpContext.GetOpenIddictServerRequest() ??
        //        throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

        //    // Retrieve the profile of the logged in user.
        //    var user = await _userManager.GetUserAsync(User) ??
        //        throw new InvalidOperationException("The user details cannot be retrieved.");

        //    // Retrieve the application details from the database.
        //    var application = await _applicationManager.FindByClientIdAsync(request.ClientId) ??
        //        throw new InvalidOperationException("Details concerning the calling client application cannot be found.");

        //    // Retrieve the permanent authorizations associated with the user and the calling client application.
        //    var authorizations = await _authorizationManager.FindAsync(
        //        subject: await _userManager.GetUserIdAsync(user),
        //        client: await _applicationManager.GetIdAsync(application),
        //        status: Statuses.Valid,
        //        type: AuthorizationTypes.Permanent,
        //        scopes: request.GetScopes()).ToListAsync();

        //    // Note: the same check is already made in the other action but is repeated
        //    // here to ensure a malicious user can't abuse this POST-only endpoint and
        //    // force it to return a valid response without the external authorization.
        //    if (!authorizations.Any() && await _applicationManager.HasConsentTypeAsync(application, ConsentTypes.External))
        //    {
        //        return Forbid(
        //            authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
        //            properties: new AuthenticationProperties(new Dictionary<string, string>
        //            {
        //                [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.ConsentRequired,
        //                [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] =
        //                    "The logged in user is not allowed to access this client application."
        //            }));
        //    }

        //    var principal = await _signInManager.CreateUserPrincipalAsync(user);

        //    // Note: in this sample, the granted scopes match the requested scope
        //    // but you may want to allow the user to uncheck specific scopes.
        //    // For that, simply restrict the list of scopes before calling SetScopes.
        //    principal.SetScopes(request.GetScopes());
        //    principal.SetResources(await _scopeManager.ListResourcesAsync(principal.GetScopes()).ToListAsync());

        //    // Automatically create a permanent authorization to avoid requiring explicit consent
        //    // for future authorization or token requests containing the same scopes.
        //    var authorization = authorizations.LastOrDefault();
        //    if (authorization is null)
        //    {
        //        authorization = await _authorizationManager.CreateAsync(
        //            principal: principal,
        //            subject: await _userManager.GetUserIdAsync(user),
        //            client: await _applicationManager.GetIdAsync(application),
        //            type: AuthorizationTypes.Permanent,
        //            scopes: principal.GetScopes());
        //    }

        //    principal.SetAuthorizationId(await _authorizationManager.GetIdAsync(authorization));

        //    foreach (var claim in principal.Claims)
        //    {
        //        claim.SetDestinations(GetDestinations(claim, principal));
        //    }

        //    // Returning a SignInResult will ask OpenIddict to issue the appropriate access/identity tokens.
        //    return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        //}

        //[Authorize, FormValueRequired("submit.Deny")]
        //[HttpPost("~/connect/authorize"), ValidateAntiForgeryToken]
        //// Notify OpenIddict that the authorization grant has been denied by the resource owner
        //// to redirect the user agent to the client application using the appropriate response_mode.
        //public IActionResult Deny() => Forbid(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        #endregion

        //#region Device flow
        //// Note: to support the device flow, you must provide your own verification endpoint action:
        //[Authorize, HttpGet("~/connect/verify")]
        //public async Task<IActionResult> Verify()
        //{
        //    var request = HttpContext.GetOpenIddictServerRequest() ??
        //        throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

        //    // If the user code was not specified in the query string (e.g as part of the verification_uri_complete),
        //    // render a form to ask the user to enter the user code manually (non-digit chars are automatically ignored).
        //    if (string.IsNullOrEmpty(request.UserCode))
        //    {
        //        return View(new VerifyViewModel());
        //    }

        //    // Retrieve the claims principal associated with the user code.
        //    var result = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        //    if (result.Succeeded)
        //    {
        //        // Retrieve the application details from the database using the client_id stored in the principal.
        //        var application = await _applicationManager.FindByClientIdAsync(result.Principal.GetClaim(Claims.ClientId)) ??
        //            throw new InvalidOperationException("Details concerning the calling client application cannot be found.");

        //        // Render a form asking the user to confirm the authorization demand.
        //        return View(new VerifyViewModel
        //        {
        //            ApplicationName = await _applicationManager.GetLocalizedDisplayNameAsync(application),
        //            Scope = string.Join(" ", result.Principal.GetScopes()),
        //            UserCode = request.UserCode
        //        });
        //    }

        //    // Redisplay the form when the user code is not valid.
        //    return View(new VerifyViewModel
        //    {
        //        Error = Errors.InvalidToken,
        //        ErrorDescription = "The specified user code is not valid. Please make sure you typed it correctly."
        //    });
        //}

        //[Authorize, FormValueRequired("submit.Accept")]
        //[HttpPost("~/connect/verify"), ValidateAntiForgeryToken]
        //public async Task<IActionResult> VerifyAccept()
        //{
        //    // Retrieve the profile of the logged in user.
        //    var user = await _userManager.GetUserAsync(User) ??
        //        throw new InvalidOperationException("The user details cannot be retrieved.");

        //    // Retrieve the claims principal associated with the user code.
        //    var result = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        //    if (result.Succeeded)
        //    {
        //        var principal = await _signInManager.CreateUserPrincipalAsync(user);

        //        // Note: in this sample, the granted scopes match the requested scope
        //        // but you may want to allow the user to uncheck specific scopes.
        //        // For that, simply restrict the list of scopes before calling SetScopes.
        //        principal.SetScopes(result.Principal.GetScopes());
        //        principal.SetResources(await _scopeManager.ListResourcesAsync(principal.GetScopes()).ToListAsync());

        //        foreach (var claim in principal.Claims)
        //        {
        //            claim.SetDestinations(GetDestinations(claim, principal));
        //        }

        //        var properties = new AuthenticationProperties
        //        {
        //            // This property points to the address OpenIddict will automatically
        //            // redirect the user to after validating the authorization demand.
        //            RedirectUri = "/"
        //        };

        //        return SignIn(principal, properties, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        //    }

        //    // Redisplay the form when the user code is not valid.
        //    return View(new VerifyViewModel
        //    {
        //        Error = Errors.InvalidToken,
        //        ErrorDescription = "The specified user code is not valid. Please make sure you typed it correctly."
        //    });
        //}

        //[Authorize, FormValueRequired("submit.Deny")]
        //[HttpPost("~/connect/verify"), ValidateAntiForgeryToken]
        //// Notify OpenIddict that the authorization grant has been denied by the resource owner.
        //public IActionResult VerifyDeny() => Forbid(
        //    authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
        //    properties: new AuthenticationProperties()
        //    {
        //        // This property points to the address OpenIddict will automatically
        //        // redirect the user to after rejecting the authorization demand.
        //        RedirectUri = "/"
        //    });
        //#endregion

        #region Logout support for interactive flows like code and implicit
        // Note: the logout action is only useful when implementing interactive
        // flows like the authorization code flow or the implicit flow.

        [HttpGet("~/connect/logout")]
        public IActionResult Logout()
        {
            if (HttpContext.Request.Cookies.TryGetValue(CurrentClients, out var currentClientsCookie))
            {
                //If the current clients cookie is set return the confirmation view
                return View();
            }
            else
            {
                //If no current clients cookie is set, this is part of a federated logout, do it right away
                return SignOut(
                    authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                    properties: new AuthenticationProperties
                    {
                        RedirectUri = "/"
                    });
            }            
        }

        [ActionName(nameof(LoggedOut)), HttpPost("~/connect/logout"), ValidateAntiForgeryToken]
        public IActionResult LoggedOut()
        {
            //This displays the page with the iframe on it that actually logs the user out
            HttpContext.Response.Cookies.Append(AllowLogout, AllowLogoutTrue, new CookieOptions()
            {
                Secure = true,
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Path = "/connect"
            });

            var model = new LoggedOutViewModel()
            {
                SignOutIframeUrl = Url.Content("~/connect/logout-iframe")
            };

            return View(model);
        }

        [ActionName(nameof(LogoutIframe)), HttpGet("~/connect/logout-iframe")]
        public async Task<IActionResult> LogoutIframe()
        {
            //This is the iframe displayed on the page to log the user out
            //It itself has iframes that call back to the apps to log them out
            if (!HttpContext.Request.Cookies.TryGetValue(AllowLogout, out var allowLogout) || allowLogout != AllowLogoutTrue)
            {
                throw new InvalidOperationException($"You must include a cookie named '{AllowLogout}' set to '{AllowLogoutTrue}'.");
            }

            if (!HttpContext.Request.Cookies.TryGetValue(CurrentClients, out var currentClientsCookie))
            {
                throw new InvalidOperationException($"Cannot logout without a '{CurrentClients}' cookie.");
            }
            var currentClients = JsonSerializer.Deserialize<HashSet<String>>(currentClientsCookie);

            var logoutUrls = await configDb.Clients.Where(i => currentClients.Contains(i.ClientId)).Select(i => i.LogoutUri).ToListAsync();

            //Sign out of the application
            await _signInManager.SignOutAsync();

            var model = new LogoutIframeViewModel()
            {
                LogoutCallbackUrls = logoutUrls
            };

            Response.Cookies.Delete(AllowLogout);
            Response.Cookies.Delete(CurrentClients);
            return View(model);
        }
        #endregion

        #region Password, authorization code, device and refresh token flows
        // Note: to support non-interactive flows like password,
        // you must provide your own token endpoint action:

        [HttpPost("~/connect/token"), Produces("application/json")]
        public async Task<IActionResult> Exchange()
        {
            var request = HttpContext.GetOpenIddictServerRequest() ??
                throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

            if (request.IsClientCredentialsGrantType())
            {
                // Note: the client credentials are automatically validated by OpenIddict:
                // if client_id or client_secret are invalid, this action won't be invoked.

                var identity = new ClaimsIdentity(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);

                // Subject (sub) is a required field, we use the client id as the subject identifier here.
                //identity.AddClaim(OpenIddictConstants.Claims.Subject, request.ClientId ?? throw new InvalidOperationException());

                //// Add some claim, don't forget to add destination otherwise it won't be added to the access token.
                //identity.AddClaim("some-claim", "some-value", OpenIddictConstants.Destinations.AccessToken);

                var principal = new ClaimsPrincipal(identity);

                principal.SetScopes(request.GetScopes());

                var app = (await _applicationManager.FindByClientIdAsync(request.ClientId)) as Client; //This will be correct if using the backend library

                var subject = guidFactory.CreateGuid(app).ToString();
                identity.AddClaim(new Claim(Claims.Subject, subject));

                // Note: in this sample, the granted scopes match the requested scope
                // but you may want to allow the user to uncheck specific scopes.
                // For that, simply restrict the list of scopes before calling SetScopes.
                principal.SetScopes(request.GetScopes());
                principal.SetResources(await _scopeManager.ListResourcesAsync(principal.GetScopes()).ToListAsync());

                return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }
            //else if (request.IsPasswordGrantType())
            //{
            //    var user = await _userManager.FindByNameAsync(request.Username);
            //    if (user is null)
            //    {
            //        return Forbid(
            //            authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
            //            properties: new AuthenticationProperties(new Dictionary<string, string>
            //            {
            //                [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.InvalidGrant,
            //                [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The username/password couple is invalid."
            //            }));
            //    }

            //    // Validate the username/password parameters and ensure the account is not locked out.
            //    var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
            //    if (!result.Succeeded)
            //    {
            //        return Forbid(
            //            authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
            //            properties: new AuthenticationProperties(new Dictionary<string, string>
            //            {
            //                [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.InvalidGrant,
            //                [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The username/password couple is invalid."
            //            }));
            //    }

            //    var principal = await _signInManager.CreateUserPrincipalAsync(user);

            //    // Note: in this sample, the granted scopes match the requested scope
            //    // but you may want to allow the user to uncheck specific scopes.
            //    // For that, simply restrict the list of scopes before calling SetScopes.
            //    principal.SetScopes(request.GetScopes());
            //    principal.SetResources(await _scopeManager.ListResourcesAsync(principal.GetScopes()).ToListAsync());

            //    foreach (var claim in principal.Claims)
            //    {
            //        claim.SetDestinations(GetDestinations(claim, principal));
            //    }

            //    // Returning a SignInResult will ask OpenIddict to issue the appropriate access/identity tokens.
            //    return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            //}

            else if (request.IsAuthorizationCodeGrantType() || request.IsDeviceCodeGrantType() || request.IsRefreshTokenGrantType())
            {
                // Retrieve the claims principal stored in the authorization code/device code/refresh token.
                var principal = (await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme)).Principal;

                // Retrieve the user profile corresponding to the authorization code/refresh token.
                // Note: if you want to automatically invalidate the authorization code/refresh token
                // when the user password/roles change, use the following line instead:
                // var user = _signInManager.ValidateSecurityStampAsync(info.Principal);
                var user = await _userManager.GetUserAsync(principal);
                if (user is null)
                {
                    return Forbid(
                        authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                        properties: new AuthenticationProperties(new Dictionary<string, string>
                        {
                            [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.InvalidGrant,
                            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The token is no longer valid."
                        }));
                }

                // Ensure the user is still allowed to sign in.
                if (!await _signInManager.CanSignInAsync(user))
                {
                    return Forbid(
                        authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                        properties: new AuthenticationProperties(new Dictionary<string, string>
                        {
                            [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.InvalidGrant,
                            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The user is no longer allowed to sign in."
                        }));
                }

                foreach (var claim in principal.Claims)
                {
                    claim.SetDestinations(GetDestinations(claim, principal));
                }

                // Returning a SignInResult will ask OpenIddict to issue the appropriate access/identity tokens.
                return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            throw new InvalidOperationException("The specified grant type is not supported.");
        }
        #endregion

        private IEnumerable<string> GetDestinations(Claim claim, ClaimsPrincipal principal)
        {
            // Note: by default, claims are NOT automatically included in the access and identity tokens.
            // To allow OpenIddict to serialize them, you must attach them a destination, that specifies
            // whether they should be included in access tokens, in identity tokens or in both.

            switch (claim.Type)
            {
                case Claims.Name:
                    yield return Destinations.AccessToken;

                    if (principal.HasScope(Scopes.Profile))
                        yield return Destinations.IdentityToken;

                    yield break;

                case Claims.Email:
                    yield return Destinations.AccessToken;

                    if (principal.HasScope(Scopes.Email))
                        yield return Destinations.IdentityToken;

                    yield break;

                case Claims.Role:
                    yield return Destinations.AccessToken;

                    if (principal.HasScope(Scopes.Roles))
                        yield return Destinations.IdentityToken;

                    yield break;

                // Never include the security stamp in the access and identity tokens, as it's a secret value.
                case "AspNet.Identity.SecurityStamp": yield break;

                default:
                    yield return Destinations.AccessToken;
                    yield break;
            }
        }
    }
}

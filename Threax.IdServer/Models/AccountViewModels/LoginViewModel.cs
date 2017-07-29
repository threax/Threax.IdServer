using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Threax.IdServer.Models.AccountInputModels;

namespace Threax.IdServer.Models.AccountViewModels
{
    public class LoginViewModel : LoginInputModel
    {
        public LoginViewModel(HttpContext httpContext)
        {
            
        }

        public LoginViewModel(HttpContext httpContext, LoginInputModel other)
            : this(httpContext)
        {
            Username = other.Username;
            Password = other.Password;
            ReturnUrl = other.ReturnUrl;
        }

        public string ErrorMessage { get; set; }
    }
}

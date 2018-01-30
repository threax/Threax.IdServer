//using Halcyon.HAL.Attributes;
//using NJsonSchema;
//using NJsonSchema.Annotations;
//using Threax.IdServer.Areas.Api.Controllers;
//using System;
//using System.Collections.Generic;
//using System.ComponentModel.DataAnnotations;
//using System.Linq;
//using System.Threading.Tasks;
//using Threax.AspNetCore.Halcyon.Ext;
//using Threax.AspNetCore.Halcyon.Ext.UIAttrs;
//using Threax.AspNetCore.Models;

//namespace Threax.IdServer.Areas.Api.Models
//{
//    [HalModel]
//    [HalSelfActionLink(typeof(ExternalUsersController), nameof(ExternalUsersController.BeginRegister))]
//    [HalActionLink(typeof(ExternalUsersController), nameof(ExternalUsersController.Register))]
//    public class RegisterEditModel
//    {
//        [Required]
//        [Display(Name = "First Name")]
//        public string FirstName { get; set; }

//        [Required]
//        [Display(Name = "Last Name")]
//        public string LastName { get; set; }

//        [Required]
//        [EmailAddress]
//        [Display(Name = "Email")]
//        public string Email { get; set; }

//        [Required]
//        [StringLength(100, ErrorMessage = "The {0} must be at least {2} and at max {1} characters long.", MinimumLength = 6)]
//        [DataType(DataType.Password)]
//        [Display(Name = "Password")]
//        [PasswordUiType]
//        public string Password { get; set; }

//        [DataType(DataType.Password)]
//        [Display(Name = "Confirm password")]
//        [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
//        [PasswordUiType]
//        public string ConfirmPassword { get; set; }

//        /// <summary>
//        /// Clear the password (set them to null) on the model.
//        /// </summary>
//        public void ClearPassword()
//        {
//            this.Password = null;
//            this.ConfirmPassword = null;
//        }
//    }
//}

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using Threax.IdServer.EntityFramework.Entities;

namespace Threax.IdServer.ToolControllers
{
    public class UnlockAccount
    {
        private UserManager<ApplicationUser> userManager;
        private ILogger<ChangePassword> logger;

        public UnlockAccount(UserManager<ApplicationUser> userManager, ILogger<ChangePassword> logger)
        {
            this.userManager = userManager;
            this.logger = logger;
        }

        public async Task Run(String userId)
        {
            var user = await userManager.FindByIdAsync(userId);
            logger.LogCritical($"Unlocking account {user.Email}");

            var result = await userManager.SetLockoutEnabledAsync(user, false);
            if (!result.Succeeded)
            {
                logger.LogError("Could not remove lockout.");
                foreach (var error in result.Errors)
                {
                    logger.LogError(error.Description);
                }
                return;
            }

            logger.LogCritical($"Unlocked {user.Email}.");
        }

        private String ReadSecureString()
        {
            string password = "";
            ConsoleKeyInfo keyInfo;

            do
            {
                keyInfo = Console.ReadKey(true);
                // Skip if Backspace or Enter is Pressed
                if (keyInfo.Key != ConsoleKey.Backspace && keyInfo.Key != ConsoleKey.Enter)
                {
                    password += keyInfo.KeyChar;
                    Console.Write("*");
                }
                else
                {
                    if (keyInfo.Key == ConsoleKey.Backspace && password.Length > 0)
                    {
                        // Remove last charcter if Backspace is Pressed
                        password = password.Substring(0, (password.Length - 1));
                        Console.Write("\b \b");
                    }
                }
            }
            // Stops Getting Password Once Enter is Pressed
            while (keyInfo.Key != ConsoleKey.Enter);

            return password;
        }
    }
}

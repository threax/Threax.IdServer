using MailKit.Net.Smtp;
using MimeKit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Threax.IdServer.Services
{
    // This class is used by the application to send email for account confirmation and password reset.
    // For more details see https://go.microsoft.com/fwlink/?LinkID=532713
    public class EmailSender : IEmailSender
    {
        public Task SendEmailAsync(string email, string subject, string message)
        {
			var bodyBuilder = new BodyBuilder();
			bodyBuilder.HtmlBody = message;
			//bodyBuilder.TextBody = message;

			var mailMessage = new MimeMessage();
			mailMessage.From.Add(new MailboxAddress("Test Org", "support@testorg.com"));
			mailMessage.To.Add(new MailboxAddress(email, email));
			mailMessage.Subject = subject;
			mailMessage.Body = bodyBuilder.ToMessageBody();

			using (var client = new SmtpClient())
			{
				client.Connect("localhost", 1025, false);

				//client.Authenticate("user", "password");

				client.Send(mailMessage);
				client.Disconnect(true);
			}

			return Task.CompletedTask;
        }
    }
}

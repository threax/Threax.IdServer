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
		private readonly EmailConfig config;

		public EmailSender(EmailConfig config)
		{
			this.config = config;
		}

		public async Task SendEmailAsync(string email, string subject, string message)
		{
			var bodyBuilder = new BodyBuilder();
			bodyBuilder.HtmlBody = message;

			var mailMessage = new MimeMessage();
			mailMessage.From.Add(new MailboxAddress(config.FromName, config.FromEmail));
			mailMessage.To.Add(new MailboxAddress(email, email));
			mailMessage.Subject = subject;
			mailMessage.Body = bodyBuilder.ToMessageBody();

			using (var client = new SmtpClient())
			{
				await client.ConnectAsync(config.Host, config.Port, config.SslOptions);

				if (config.UseAuthentication)
				{
					await client.AuthenticateAsync(config.User, config.Password);
				}

				await client.SendAsync(mailMessage);
				await client.DisconnectAsync(true);
			}
		}
	}

    public class NullEmailSender : IEmailSender
    {
        public Task SendEmailAsync(string email, string subject, string message)
        {
			return Task.CompletedTask;
        }
    }
}
